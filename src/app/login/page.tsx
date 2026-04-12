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
      router.refresh();
      router.push(result.rol === 'ADMIN' ? '/admin' : '/operador');
    }
  };

  const togglePasswordVisibility = () => {
    const newShowPassword = !showPassword;
    setShowPassword(newShowPassword);
    // El robot reacciona al nuevo estado: si es visible (isHidden = false)
    robotRef.current?.playTogglePasswordVisibility(!newShowPassword);
  };

  return (
    <main className={`flex min-h-screen items-center justify-center ${currentTheme.background} p-6 overflow-hidden relative`}>
      <div className={`w-full max-w-md rounded-2xl border ${currentTheme.border} ${currentTheme.card} shadow-xl relative z-10 mt-16`}>
        
        <InteractiveRobot ref={robotRef} />

        <div className="flex flex-col items-center justify-center gap-2 border-b border-slate-100 bg-slate-50/70 pt-16 pb-6 rounded-t-2xl">
          <h1 className="text-xl font-bold text-slate-900">Sistema Inventario</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Bodega Informática</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-600 text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => robotRef.current?.playFocusEmail()}
                  onBlur={() => robotRef.current?.playBlurEmail()}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="admin@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => robotRef.current?.playFocusPassword(!showPassword)}
                  onBlur={() => robotRef.current?.playBlurPassword()}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70 shadow-md ${currentTheme.primary}`}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="h-5 w-5" /> Iniciar Sesión</>}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}