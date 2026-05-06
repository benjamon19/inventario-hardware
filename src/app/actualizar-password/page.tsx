'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Lock, CheckCircle, AlertCircle, KeyRound, Loader2 } from 'lucide-react';

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // Nuevo estado de validación

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let mounted = true;

    // Verificación inicial por si la sesión ya está establecida mediante SSR/Cookies
    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        setIsChecking(false);
      }
    };
    verifySession();

    // Escuchar eventos de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' || session) {
        setErrorMsg(null);
        setIsChecking(false); // Sesión válida, quitamos el loader
      } else if (event === 'SIGNED_OUT') {
        // Le damos 2 segundos a Supabase para procesar la URL antes de declarar el enlace inválido
        setTimeout(() => {
          if (mounted && !session) {
            setErrorMsg('El enlace de recuperación no es válido o ha expirado.');
            setIsChecking(false);
          }
        }, 2000);
      }
    });

    return () => {
      mounted = false;
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
      setIsUpdating(false);
    } else {
      setSuccessMsg('¡Contraseña actualizada con éxito!');
      // Redirigir al login después de mostrar el éxito
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-center">Restablecer Contraseña</h1>
          <p className="text-sm text-slate-500 text-center mt-2">
            Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
          </p>
        </div>

        {isChecking ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            <p className="text-sm text-slate-500 animate-pulse">Verificando enlace seguro...</p>
          </div>
        ) : errorMsg && !successMsg && !password ? (
          // Vista cuando el enlace expira (escondemos el formulario)
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center text-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          // Vista del formulario
          <>
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 transition-all">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 transition-all">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">{successMsg}</p>
                  <p className="text-xs font-medium text-emerald-600 mt-1">Redirigiendo al inicio de sesión...</p>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nueva Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    disabled={!!successMsg || isUpdating}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    disabled={!!successMsg || isUpdating}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdating || !!successMsg}
                className="w-full mt-6 bg-slate-900 text-white font-medium py-3 rounded-xl shadow-sm hover:bg-slate-800 hover:shadow-md transition-all focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Guardar nueva contraseña'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}