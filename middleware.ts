import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_MAX = 100; // Peticiones máximas
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto

export async function middleware(request: NextRequest) {
  // --- RATE LIMITING BÁSICO ---
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();

  const clientData = rateLimitMap.get(ip);
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  } else {
    clientData.count++;
    if (clientData.count > RATE_LIMIT_MAX) {
      return new NextResponse('Too Many Requests. Please try again later.', { status: 429 });
    }
  }

  // Limpieza periódica del Map para evitar fugas de memoria
  if (Math.random() < 0.05) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) rateLimitMap.delete(key);
    }
  }
  // --- FIN RATE LIMITING ---
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

  // Obtenemos el usuario actual de la sesión
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Si no hay usuario y no está en la página de login, redirigir a login
  if (!user && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Protecciones para rutas internas (solo si hay usuario)
  if (user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/operador'))) {

    // Consultamos SIEMPRE la tabla perfiles para verificar rol y si está ACTIVO
    // Esto es el seguro de vida contra usuarios desactivados con la sesión "recordada"
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, estado')
      .eq('id', user.id)
      .single();

    // Si el usuario fue desactivado, destruimos la sesión y lo pateamos al login
    if (perfil?.estado !== 'ACTIVO') {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // PROTECCIÓN ESPECÍFICA DE RUTAS /admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // Priorizamos el rol de la tabla (que está fresco), o caemos al de metadata
      const rol = perfil?.rol || user?.app_metadata?.user_role;

      // DEBUG para Vercel Logs
      console.log("=== DEBUG MIDDLEWARE PROD ===");
      console.log("Usuario:", user?.email);
      console.log("Rol Final Detectado:", rol);
      console.log("Estado:", perfil?.estado);
      console.log("=============================");

      // Si después de todo no es ADMIN, lo mandamos a la zona de operador
      if (!['ADMIN', 'SUPER_ADMIN'].includes(rol)) {
        return NextResponse.redirect(new URL('/operador', request.url));
      }
    }
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