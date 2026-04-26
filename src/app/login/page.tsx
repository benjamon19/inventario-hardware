'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
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
      await new Promise(r => setTimeout(r, 1500));
      if (robotRef.current) {
        await robotRef.current.playDespedida();
      }
      router.refresh();

      const isAdministrador = result.rol === 'ADMIN' || result.rol === 'SUPER_ADMIN';
      router.push(isAdministrador ? '/admin' : '/operador');
    }
  };

  const togglePasswordVisibility = () => {
    const newShowPassword = !showPassword;
    setShowPassword(newShowPassword);
    robotRef.current?.playTogglePasswordVisibility(!newShowPassword);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">

      {/* ── Fondo animado ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,#38bdf815,transparent)]"></div>
        
        {/* Luces de fondo (Nebulosas) */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-sky-400/10 blur-[100px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[110px] animate-[pulse_12s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/4 left-1/2 w-[400px] h-[400px] rounded-full bg-rose-400/5 blur-[90px] animate-[pulse_15s_ease-in-out_infinite_3s]" />
        
        {/* Partículas variadas y abundantes */}
        <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-sky-400/60 rounded-full blur-[1px] animate-[ping_3s_infinite]" />
        <div className="absolute top-[25%] right-[20%] w-3 h-3 bg-amber-400/50 rounded-full blur-[2px] animate-[ping_4s_infinite_1s]" />
        <div className="absolute bottom-[20%] left-[15%] w-1.5 h-1.5 bg-slate-400/40 rounded-full animate-[ping_5s_infinite_0.5s]" />
        <div className="absolute bottom-[35%] right-[10%] w-2 h-2 bg-indigo-400/40 rounded-full animate-[ping_6s_infinite_2s]" />
        <div className="absolute top-[55%] left-[45%] w-1 h-1 bg-sky-300/60 rounded-full animate-[ping_3.5s_infinite_1.5s]" />
        <div className="absolute top-[40%] right-[45%] w-2.5 h-2.5 bg-amber-300/40 rounded-full animate-[ping_4.5s_infinite_0.2s]" />
        <div className="absolute top-[70%] right-[30%] w-2 h-2 bg-rose-400/40 rounded-full blur-[1px] animate-[ping_5.5s_infinite_1.2s]" />
        <div className="absolute bottom-[10%] left-[40%] w-1.5 h-1.5 bg-emerald-400/40 rounded-full animate-[ping_7s_infinite_0.8s]" />
        <div className="absolute top-[5%] right-[5%] w-2 h-2 bg-sky-500/30 rounded-full animate-[pulse_4s_infinite]" />
        <div className="absolute bottom-[5%] left-[5%] w-3 h-3 bg-amber-500/20 rounded-full animate-[pulse_5s_infinite_1.5s]" />

        {/* Rayas de "datos" sutiles */}
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-sky-400/10 to-transparent animate-[pulse_6s_linear_infinite]" />
        <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-amber-400/10 to-transparent animate-[pulse_8s_linear_infinite_reverse]" />
      </div>

      <div className="w-[92%] max-w-[360px] relative z-10 max-[500px]:translate-y-8 min-[501px]:max-[1350px]:translate-y-16 min-[501px]:max-[1350px]:scale-[0.85]">
        {/* Aros inteligentes que siguen al robot (dentro del contenedor) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0 pointer-events-none z-[-1]">
          {/* Aro Exterior Extra */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 md:w-56 md:h-56 rounded-full border border-slate-200/5 animate-[spin_20s_linear_infinite]" />
          
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 md:w-40 md:h-40 rounded-full border border-amber-300/30 animate-[spin_10s_linear_infinite]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_3px_rgba(251,191,36,0.6)]" />
          </div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full border border-sky-400/30 animate-[spin_7s_linear_infinite_reverse]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_12px_3px_rgba(56,189,248,0.6)]" />
          </div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full border border-rose-400/20 animate-[spin_15s_linear_infinite]">
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-1 rounded-full bg-rose-400 shadow-[0_0_8px_2px_rgba(251,113,133,0.4)]" />
          </div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full border border-slate-900/10 animate-[spin_12s_linear_infinite_reverse]">
            <div className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-slate-900/40" />
          </div>
        </div>
        <div className="w-full rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-visible backdrop-blur-md">

          <InteractiveRobot ref={robotRef} />

          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-1 border-b border-slate-100 pt-10 pb-4 md:pt-12 md:pb-5 rounded-t-3xl bg-slate-50/50">
            <h1 className="text-base md:text-lg font-bold text-slate-900">Sistema Inventario</h1>
            <p className="text-[9px] md:text-[10px] font-medium uppercase tracking-widest text-slate-500">Bodega Informática</p>
          </div>

          {/* Formulario */}
          <div className="p-5 md:p-6">
            <form onSubmit={handleLogin} className="space-y-3.5 md:space-y-4">
              {errorMsg && (
                <div className="rounded-xl bg-red-50 p-2.5 md:p-3 border border-red-200 text-xs md:text-sm text-red-600 text-center font-bold">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold ml-1 text-slate-500">Correo Electrónico</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    maxLength={100}
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    onFocus={() => robotRef.current?.playFocusEmail()}
                    onBlur={() => robotRef.current?.playBlurEmail()}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 md:py-3 pl-9 md:pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all max-[390px]:py-2 max-[390px]:text-xs"
                    placeholder="ejemplo@empresa.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold ml-1 text-slate-500">Contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={100}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => robotRef.current?.playFocusPassword(!showPassword)}
                    onBlur={() => robotRef.current?.playBlurPassword()}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 md:py-3 pl-9 md:pl-10 pr-10 md:pr-12 text-sm text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all max-[390px]:py-2 max-[390px]:text-xs"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Recuérdame */}
              <div className="flex items-center gap-2 mt-2 md:mt-3 px-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-200 text-slate-900 accent-slate-900 focus:ring-slate-900 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs md:text-sm text-slate-500 font-bold cursor-pointer select-none">
                  Recuérdame
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group mt-2 md:mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 md:py-4 text-xs md:text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-slate-200 cursor-pointer max-[390px]:py-2.5 hover:bg-slate-800"
              >
                {isLoading
                  ? <div className="flex items-center justify-center h-4 w-4 md:h-5 md:w-5"><TailChase size="16" speed="1.75" color="white" /></div>
                  : <><LogIn className="h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" /> Iniciar Sesión</>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}