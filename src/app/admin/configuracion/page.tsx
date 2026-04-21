'use client';

import { Settings, Moon, Sun, Monitor, Shield, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { t } from '@/config/theme';

export default function ConfiguracionPage() {
  const { mode, setTheme } = useTheme();

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
      setMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setPassword('');
      setConfirmPassword('');
    }
    setIsUpdating(false);
  };

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'light',
      label: 'Claro',
      description: 'Fondo blanco hueso, texto oscuro',
      icon: <Sun className="h-5 w-5 text-amber-500" />,
    },
    {
      value: 'dark',
      label: 'Oscuro (Beta)',
      description: 'Fondo negro zinc, texto claro',
      icon: <Moon className="h-5 w-5 text-blue-400" />,
    },
    {
      value: 'system',
      label: 'Sistema (Beta)',
      description: 'Sigue la preferencia del sistema',
      icon: <Monitor className="h-5 w-5 text-slate-400 dark:text-zinc-400" />,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Encabezado */}
      <div>
        <h1 className={`text-2xl font-bold ${t.text}`}>Configuración</h1>
        <p className={`text-sm ${t.textMuted}`}>Personaliza la apariencia y preferencias de tu panel administrativo.</p>
      </div>

      <div className="grid gap-6">
        {/* ── Apariencia ── */}
        <div className={`rounded-3xl border ${t.border} ${t.card} p-8 shadow-sm`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Monitor className="h-5 w-5" />
            </div>
            <h2 className={`text-lg font-bold ${t.text}`}>Apariencia</h2>
          </div>

          <p className={`text-sm font-medium mb-4 ${t.textMuted}`}>Selecciona el tema visual de la aplicación</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((opt) => {
              const isActive = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                    isActive
                      ? 'border-blue-600 dark:border-emerald-500 bg-blue-50/50 dark:bg-emerald-950/20'
                      : `${t.border} ${t.cardHover}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.cardElevated}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${t.text}`}>{opt.label}</p>
                      <p className={`text-xs ${t.textSubtle}`}>{opt.description}</p>
                    </div>
                  </div>
                  {/* Indicador activo */}
                  <div className={`h-3 w-3 rounded-full shrink-0 transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 dark:bg-emerald-500 shadow-[0_0_8px_rgba(37,99,235,0.5)] dark:shadow-[0_0_8px_rgba(16,185,129,0.5)] scale-100'
                      : 'scale-0 opacity-0'
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Preview del tema activo */}
          <div className={`mt-5 flex items-center gap-2 px-4 py-3 rounded-xl ${t.cardElevated} border ${t.borderSubtle}`}>
            <div className={`h-2 w-2 rounded-full ${mode === 'light' ? 'bg-amber-400' : mode === 'dark' ? 'bg-blue-400' : 'bg-slate-400 dark:bg-zinc-400'}`} />
            <p className={`text-xs font-medium ${t.textMuted}`}>
              Tema activo: <span className={`font-bold ${t.text}`}>{themeOptions.find(o => o.value === mode)?.label}</span>
              {mode === 'system' && <span className={t.textSubtle}> (detectado automáticamente)</span>}
            </p>
          </div>
        </div>

        {/* ── Seguridad ── */}
        <div className={`rounded-3xl border ${t.border} ${t.card} p-8 shadow-sm`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className={`text-lg font-bold ${t.text}`}>Seguridad</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
            <p className={`text-sm font-medium ${t.textMuted}`}>Actualizar contraseña de acceso</p>

            <div className="space-y-3">
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${t.textSubtle}`} />
                <input
                  type="password"
                  required
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${t.input}`}
                />
              </div>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${t.textSubtle}`} />
                <input
                  type="password"
                  required
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${t.input}`}
                />
              </div>
            </div>

            {msg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border ${
                msg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-400'
                  : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400'
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
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 cursor-pointer ${t.primary}`}
            >
              {isUpdating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Actualizando...</>
                : 'Actualizar contraseña'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}