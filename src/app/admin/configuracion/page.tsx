'use client';

import { useState } from 'react';
import { Settings, Moon, Sun, Monitor, Bell, Shield } from 'lucide-react';

export default function ConfiguracionPage() {
  const [theme, setTheme] = useState('light');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
              {/* Opción Tema Claro */}
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

              {/* Opción Tema Oscuro */}
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
                {theme === 'dark' && <div className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sección de Seguridad (Placeholder) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm opacity-60">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Seguridad</h2>
          </div>
          <p className="text-sm text-slate-500 italic">Próximamente: Cambio de contraseña y autenticación de dos factores.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
          Descartar
        </button>
        <button className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg cursor-pointer">
          Guardar cambios
        </button>
      </div>
    </div>
  );
}