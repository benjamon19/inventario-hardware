'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Package, Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { currentTheme } from '@/config/theme';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(useGSAP);

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
    tl.fromTo('.gsap-item',
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, stagger: 0.15 }
    );
  }, { scope: containerRef });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    
    // 1. Intentar inicio de sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Credenciales incorrectas. Inténtalo de nuevo.');
      setIsLoading(false);
      return;
    }

    if (data.session) {
      // 2. Si hay sesión, consultar el ROL del usuario en la tabla perfiles
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', data.session.user.id)
        .single();

      if (perfilError) {
        console.error("Error obteniendo perfil:", perfilError);
      }

      // 3. Refrescar y Redirigir según el rol
      router.refresh();
      
      if (perfil?.rol === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <main ref={containerRef} className={`flex min-h-screen items-center justify-center ${currentTheme.background} p-6`}>
      <div className={`gsap-item invisible w-full max-w-md overflow-hidden rounded-2xl border ${currentTheme.border} ${currentTheme.card} shadow-xl`}>
        
        {/* Cabecera */}
        <div className="flex flex-col items-center justify-center gap-3 border-b border-slate-100 bg-slate-50/70 px-8 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Package className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Sistema Control de Inventario</h1>
            <p className="mt-1 text-sm font-medium uppercase tracking-widest text-slate-500">Bodega Área Informática</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="gsap-item rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-600 text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div className="gsap-item invisible space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Correo Electrónico</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="admin@empresa.com"
                />
              </div>
            </div>

            <div className="gsap-item invisible space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Contraseña</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Recordar Sesión */}
            <div className="gsap-item invisible flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 bg-slate-50 text-blue-600 transition-all focus:ring-2 focus:ring-blue-600/20 shadow-sm"
                />
                <label htmlFor="remember-me" className="ml-2 cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Recordar mi sesión
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`gsap-item invisible mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all hover:cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 shadow-md hover:shadow-lg ${currentTheme.primary}`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" /> Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}