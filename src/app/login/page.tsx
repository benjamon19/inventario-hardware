'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { currentTheme } from '@/config/theme';
import { procesarLogin } from './actions';
import InteractiveRobot, { RobotHandle } from './robot/InteractiveRobot';

export default function LoginPage() {
  const robotRef = useRef<RobotHandle>(null);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const result = await procesarLogin(email, password, rememberMe);

    if (result?.error) {
      robotRef.current?.playError();
      setErrorMsg(result.error);
      setIsLoading(false);
      return;
    }

    if (result?.success) {
      robotRef.current?.playSuccess();
      
      // Esperamos 1.5s para que el usuario vea la alegría del robot
      await new Promise(r => setTimeout(r, 1500)); 
      
      // El robot despega como un cohete
      if (robotRef.current) {
        await robotRef.current.playDespedida();
      }
      
      router.refresh();
      router.push(result.rol === 'ADMIN' ? '/admin' : '/operador');
    }
  };

  const togglePasswordVisibility = () => {
    const newShowPassword = !showPassword;
    setShowPassword(newShowPassword);
    robotRef.current?.playTogglePasswordVisibility(!newShowPassword);
  };

  return (
    <main className={`flex min-h-screen items-center justify-center ${currentTheme.background} p-6 relative`}>

      {/* ── Fondo animado Mejorado ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        
        {/* Malla de puntos (Grid estilo tecnológico) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>

        {/* Blobs de color */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-400/10 blur-3xl animate-[pulse_4s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-400/5 blur-2xl animate-[pulse_6s_ease-in-out_infinite_2s]" />

        {/* Partículas flotantes intermitentes */}
        <div className="absolute top-[20%] left-[20%] w-2 h-2 bg-sky-400/60 rounded-full blur-[1px] animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute bottom-[30%] right-[25%] w-3 h-3 bg-amber-400/50 rounded-full blur-[2px] animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
        <div className="absolute top-[60%] left-[70%] w-1.5 h-1.5 bg-emerald-400/60 rounded-full blur-[1px] animate-[ping_5s_cubic-bezier(0,0,0.2,1)_infinite_2s]" />

        {/* Anillos orbitales detrás del robot (con resplandor en las "estrellitas") */}
        <div className="absolute top-[18%] md:top-[15%] left-1/2 -translate-x-1/2 w-44 h-44 md:w-56 md:h-56 rounded-full border border-amber-300/15 animate-[spin_10s_linear_infinite]">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]" />
        </div>
        <div className="absolute top-[18%] md:top-[15%] left-1/2 -translate-x-1/2 w-36 h-36 md:w-44 md:h-44 rounded-full border border-sky-400/15 animate-[spin_7s_linear_infinite_reverse]">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-400/90 shadow-[0_0_8px_2px_rgba(56,189,248,0.5)]" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400/90 shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]" />
        </div>
      </div>

      {/* ── Card ── */}
      <div className={`w-full max-w-md rounded-2xl border ${currentTheme.border} ${currentTheme.card} shadow-xl relative z-10 mt-16 overflow-visible backdrop-blur-sm`}>

        <InteractiveRobot ref={robotRef} />

        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-2 border-b border-slate-100 bg-slate-50/70 pt-16 pb-6 rounded-t-2xl">
          <h1 className="text-xl font-bold text-slate-900">Sistema Inventario</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Bodega Informática</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-600 text-center font-medium">
                {errorMsg}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => robotRef.current?.playFocusEmail()}
                  onBlur={() => robotRef.current?.playBlurEmail()}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-base md:text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="user@ejemplo.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => robotRef.current?.playFocusPassword(!showPassword)}
                  onBlur={() => robotRef.current?.playBlurPassword()}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-base md:text-sm outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`group mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70 shadow-md cursor-pointer ${currentTheme.primary}`}
            >
              {isLoading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <><LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform" /> Iniciar Sesión</>
              }
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}