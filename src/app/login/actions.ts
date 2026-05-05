'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function procesarLogin(email: string, pass: string, recordar: boolean) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (recordar) {
              // Si quiere ser recordado, forzamos la cookie a 30 días (en segundos)
              options.maxAge = 30 * 24 * 60 * 60;
            } else {
              // Si no, eliminamos la expiración para que sea una sesión de navegador
              delete options.maxAge;
              delete options.expires;
            }
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) {
    return { error: 'Credenciales incorrectas. Inténtalo de nuevo.' };
  }

  // Obtenemos el rol y el estado del usuario
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, estado')
    .eq('id', data.user.id)
    .single();

  // Si el usuario no está activo, lo bloqueamos de inmediato
  if (perfil && perfil.estado !== 'ACTIVO') {
    await supabase.auth.signOut(); // Destruimos la sesión en Supabase
    return { error: 'Tu cuenta ha sido desactivada. Por favor, contacta al administrador.' };
  }

  // Registrar login
  await supabase.from('auditoria_logs').insert([{
    usuario_id: data.user.id,
    accion: 'ACCESO',
    entidad: 'SISTEMA',
    entidad_id: null,
    detalles: {
      email: email,
      detalle: 'Inicio de sesión exitoso'
    }
  }]);

  return { success: true, rol: perfil?.rol };
}

export async function recuperarPassword(email: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/actualizar-password`,
  });

  if (error) {
    return { error: 'Error al enviar el correo. Verifica que tu email sea válido y esté registrado.' };
  }

  return { success: true };
}