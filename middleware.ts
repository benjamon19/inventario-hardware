import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Obtenemos el usuario actual
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Si no hay usuario y no está en la página de login, redirigir a login
  if (!user && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. PROTECCIÓN DE RUTAS /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Intentamos leer el rol desde el token (app_metadata)
    let rol = user?.app_metadata?.user_role;

    // RESPALDO: Si el Hook falló y el rol es undefined, consultamos la tabla directamente
    if (!rol && user) {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single();
      
      rol = perfil?.rol;
    }

    // DEBUG para Vercel Logs
    console.log("=== DEBUG MIDDLEWARE PROD ===");
    console.log("Usuario:", user?.email);
    console.log("Rol Final Detectado:", rol);
    console.log("=============================");

    // Si después de todo no es ADMIN, lo mandamos a la zona de operador
    if (rol !== 'ADMIN') {
      return NextResponse.redirect(new URL('/operador', request.url));
    }
  }

  // 3. PROTECCIÓN DE RUTAS /operador (Evitar que entren sin login)
  if (request.nextUrl.pathname.startsWith('/operador') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (icono del sitio)
     * - archivos con extensiones (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};