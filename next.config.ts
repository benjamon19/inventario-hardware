// next.config.ts
import type { NextConfig } from "next";

const securityHeaders = [
  {
    // Evita que la página sea incrustada en iframes (Clickjacking)
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    // Evita que el navegador intente adivinar el tipo MIME
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Fuerza el uso de HTTPS
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Controla cuánta información se envía en la cabecera Referer
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  }
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        // Aplica estas cabeceras a todas las rutas de la aplicación
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;