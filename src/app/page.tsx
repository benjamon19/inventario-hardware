import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Si por alguna razón pasó el middleware sin login, lo mandamos a login
  if (!user) {
    redirect('/login');
  }

  // Consultar el rol del usuario
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  // Redirigir según el rol
  if (perfil?.rol === 'ADMIN') {
    redirect('/admin');
  } else {
    // Si no es admin, asumimos que es operador y lo mandamos a su panel
    redirect('/operador');
  }
}