'use client';

import { Shield, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
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
      setMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setPassword('');
      setConfirmPassword('');
    }
    setIsUpdating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Administra la seguridad y preferencias de tu cuenta.</p>
      </div>

      <div className="grid gap-6">
        {/* ── Seguridad ── */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Seguridad</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
            <p className="text-sm font-medium text-slate-500">Actualizar contraseña de acceso</p>

            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {msg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border ${
                msg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {msg.type === 'success'
                  ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                  : <AlertCircle className="h-4 w-4 shrink-0" />
                }
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdating || !password}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUpdating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Actualizando...</>
                : 'Actualizar contraseña'
              }
            </button>
          </form>
        </div>

        {/* Info Box - Reemplazo de Apariencia */}
        <div className="rounded-2xl bg-slate-100 p-6 border border-slate-200">
          <p className="text-xs text-slate-500 font-medium italic">
            Nota: El sistema está optimizado para su visualización en modo claro para garantizar la legibilidad en entornos de trabajo con luz natural.
          </p>
        </div>
      </div>
    </div>
  );
}