'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function crearUsuarioDesdeAdmin(email: string, password: string) {
  try {
    // 1. Crea el usuario en Authentication de forma silenciosa.
    // y crea la fila en la tabla "perfiles".
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, 
    });

    if (authError) throw new Error(authError.message);

    return { success: true, message: 'Usuario creado exitosamente.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}