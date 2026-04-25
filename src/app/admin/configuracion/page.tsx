'use client';

import { Shield, Lock, CheckCircle2, AlertCircle, Info, KeyRound } from 'lucide-react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { supabase } from '@/lib/supabase';
import { registrarLog } from '@/lib/logger';
import { useState } from 'react';

export default function ConfiguracionPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
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
                    <KeyRound className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Escribe tu nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">
                  Confirmar Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
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
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 cursor-pointer"
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

        {/* Info Box - Apariencia Optimizada */}
        <div className="flex items-start gap-4 rounded-[2rem] bg-blue-50/50 p-6 border border-blue-100/50">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Info className="h-5 w-5" />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-bold text-blue-900 mb-1">Entorno de Visualización</h3>
            <p className="text-xs text-blue-800/80 leading-relaxed max-w-2xl font-medium">
              El sistema se encuentra permanentemente optimizado en <strong>Modo Claro</strong>. Esta decisión de diseño garantiza el máximo contraste y legibilidad para operar en entornos con alta iluminación, como bodegas o luz natural directa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}