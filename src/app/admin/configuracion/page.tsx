'use client';

import { useState } from 'react';
import { Settings, Moon, Sun, Monitor, Bell, Shield, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ConfiguracionPage() {
  const [theme, setTheme] = useState('light');
  
  // Estados para contraseña
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (password !== confirmPassword) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    setIsUpdating(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setPassword('');
      setConfirmPassword('');
    }

    setIsUpdating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Personaliza la apariencia y preferencias de tu panel administrativo.</p>
      </div>

      <div className="grid gap-6">
        {/* Sección de Apariencia */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Monitor className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Apariencia</h2>
          </div>

          <div className="space-y-6">
            <p className="text-sm text-slate-600 font-medium">Selecciona el tema visual de la aplicación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setTheme('light')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  theme === 'light' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white shadow-sm rounded-lg border border-slate-100">
                    <Sun className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="font-bold text-slate-700">Claro</span>
                </div>
                {theme === 'light' && <div className="h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
              </button>

              <button 
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  theme === 'dark' ? 'border-blue-600 bg-slate-900 text-white' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Moon className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>Oscuro</span>
                </div>
                {theme === 'dark' && <div className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_8_rgba(96,165,250,0.6)]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sección de Seguridad */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Seguridad</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
            <p className="text-sm text-slate-600 font-medium">Actualizar contraseña de acceso</p>
            
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {msg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border ${
                msg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdating || !password}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}