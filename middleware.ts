import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Map de fallback para cuando no hay Upstash configurado
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  : null;

const ratelimit = redis
  ? new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
  })
  : null;

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

  // --- RATE LIMITING ---
  if (ratelimit) {
    const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);
    if (!success) {
      return new NextResponse('Too Many Requests. Please try again later.', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      });
    }
  } else {
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
    if (Math.random() < 0.05) {
      for (const [key, val] of rateLimitMap.entries()) {
        if (now > val.resetTime) rateLimitMap.delete(key);
      }
    }
  }
  // --- FIN RATE LIMITING ---

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
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

  // Rutas públicas — no requieren sesión
  const publicRoutes = ['/login', '/actualizar-password', '/auth/callback'];
  if (!user && !publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protección de rutas internas
  if (user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/operador'))) {

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, estado')
      .eq('id', user.id)
      .single();

    if (perfil?.estado !== 'ACTIVO') {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
      const rol = perfil?.rol || user?.app_metadata?.user_role;

      console.log("=== DEBUG MIDDLEWARE PROD ===");
      console.log("Usuario:", user?.email);
      console.log("Rol Final Detectado:", rol);
      console.log("Estado:", perfil?.estado);
      console.log("=============================");

      if (!['ADMIN', 'SUPER_ADMIN'].includes(rol)) {
        return NextResponse.redirect(new URL('/operador', request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};