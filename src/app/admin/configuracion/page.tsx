'use client';

import { Shield, Lock, CheckCircle2, AlertCircle, Info, KeyRound } from 'lucide-react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { supabase } from '@/lib/supabase';
import { registrarLog } from '@/lib/logger';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import wallIco from '@/app/wall-ico.svg';

export default function ConfiguracionPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const router = useRouter();
  const [isRestartingTour, setIsRestartingTour] = useState(false);

  const handleRestartTour = async () => {
    setIsRestartingTour(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('perfiles')
          .update({ ha_visto_tour: false })
          .eq('id', user.id);

        localStorage.removeItem('wall_tour_completed');

        // Redirigimos al admin que lanzará el tour de nuevo
        window.location.href = '/admin';
      }
    } catch (e) {
      console.error(e);
      setIsRestartingTour(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (password !== confirmPassword) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden. Por favor, verifica e inténtalo de nuevo.' });
      return;
    }
    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      await registrarLog('EDICION', 'SEGURIDAD', null, {
        detalle: 'Actualización de contraseña de usuario'
      });
      setMsg({ type: 'success', text: 'Tu contraseña ha sido actualizada exitosamente.' });
      setPassword('');
      setConfirmPassword('');
    }
    setIsUpdating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configuración de Cuenta</h1>
        <p className="text-sm text-slate-500 mt-1">Administra la seguridad y preferencias de tu entorno de trabajo.</p>
      </div>

      <div className="grid gap-6">
        {/* ── Seguridad ── */}
        <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-inner border border-emerald-200/50">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Seguridad y Acceso</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Protege tu cuenta actualizando tus credenciales</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="max-w-md space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">
                  Nueva Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Escribe tu nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">
                  Confirmar Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {msg && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl border ${msg.type === 'success'
                ? 'bg-emerald-50 border-emerald-100/60'
                : 'bg-red-50 border-red-100/60'
                }`}>
                {msg.type === 'success'
                  ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  : <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                }
                <p className={`text-sm font-semibold leading-relaxed ${msg.type === 'success' ? 'text-emerald-800' : 'text-red-800'
                  }`}>
                  {msg.text}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdating || !password || !confirmPassword}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 cursor-pointer"
              >
                {isUpdating ? (
                  <><div className="flex h-4 w-4 items-center justify-center"><TailChase size="16" speed="1.75" color="white" /></div> Guardando cambios...</>
                ) : (
                  'Actualizar Contraseña'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid gap-6">
        {/* ── Recorrido de Bienvenida ── */}
        <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-inner">
              <img src={typeof wallIco === 'object' ? (wallIco as any).src ?? String(wallIco) : String(wallIco)} alt="" className="h-7 w-7 object-contain drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recorrido de Bienvenida</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Vuelve a ver el tutorial interactivo de la plataforma</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Si quieres repasar cómo funcionan las distintas herramientas y vistas de Wall, puedes reiniciar el recorrido interactivo.
            </p>
            <button
              onClick={handleRestartTour}
              disabled={isRestartingTour}
              className="flex shrink-0 items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRestartingTour ? (
                <>
                  <div className="flex h-4 w-4 items-center justify-center">
                    <TailChase size="16" speed="1.75" color="#0f172a" />
                  </div>
                  <span>Iniciando...</span>
                </>
              ) : (
                'Repetir recorrido'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}