import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Si no hay usuario y no está en login, al login.
  if (!user && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. PROTECCIÓN DE ROL USANDO EL TOKEN
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Leemos el rol inyectado por nuestro Hook sin hacer peticiones extra a la BD
    const rol = user?.app_metadata?.user_role;

    // --- BLOQUE DE DEBUG: MIRA TU TERMINAL (donde corre npm run dev) ---
    console.log("=== DEBUG MIDDLEWARE ===");
    console.log("Email:", user?.email);
    console.log("Metadata completa:", user?.app_metadata);
    console.log("Rol detectado:", rol);
    console.log("========================");

    if (rol !== 'ADMIN') {
      return NextResponse.redirect(new URL('/operador', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};