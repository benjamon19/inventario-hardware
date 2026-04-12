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
            // La lógica central: Si no quiere ser recordado, eliminamos
            // los atributos de expiración para crear una Session Cookie pura.
            if (!recordar) {
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

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', data.user.id)
    .single();

  return { success: true, rol: perfil?.rol };
}