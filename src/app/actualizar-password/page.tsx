'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Escuchar cambios de autenticación para detectar cuando la sesión de recuperación esté lista
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Sesión de recuperación detectada correctamente
        setErrorMsg(null);
      } else if (!session) {
        // Si después de un breve momento no hay nada, entonces sí es error
        setTimeout(async () => {
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          if (!finalSession) {
            setErrorMsg('El enlace no es válido o ha expirado.');
          }
        }, 1500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setErrorMsg('Hubo un error al actualizar la contraseña: ' + error.message);
    } else {
      setSuccessMsg('¡Contraseña actualizada con éxito!');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
    setIsUpdating(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Restablecer Contraseña</h1>
        <p className="text-sm text-slate-500 mb-8">Ingresa tu nueva contraseña para acceder al sistema.</p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">{successMsg}</p>
              <p className="text-xs font-medium text-emerald-600 mt-1">Redirigiendo al inicio de sesión...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-500 ml-1">Nueva Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-900 focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-500 ml-1">Confirmar Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-900 focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isUpdating || !!successMsg}
            className="w-full mt-4 bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-800 transition-all disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
          >
            {isUpdating ? 'Actualizando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
