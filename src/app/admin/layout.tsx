'use client';

import React, { useState, Fragment } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { 
  LayoutDashboard, Box, History, Users, LogOut, 
  Package, AlertCircle, X, Settings, QrCode 
} from 'lucide-react';
import { currentTheme } from '@/config/theme';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Inventario', href: '/admin/inventario', icon: Box },
    { name: 'Actividad', href: '/admin/actividad', icon: History },
    { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
  ];

  // Nuevas opciones solicitadas
  const toolItems = [
    { name: 'Generar QR', href: '/admin/generar-qr', icon: QrCode },
    { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className={`flex min-h-screen ${currentTheme.background}`}>
      {/* Sidebar Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r ${currentTheme.border} ${currentTheme.card} hidden md:flex flex-col`}>
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Package className="h-6 w-6 text-blue-600" />
          <span className="font-bold tracking-tight text-slate-900 text-lg">TI Bodega</span>
        </div>
        
        {/* Navegación Principal */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Menú</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sección de Herramientas y Ajustes (Arriba de cerrar sesión) */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ajustes</p>
          {toolItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
          
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 cursor-pointer transition-colors group mt-2"
          >
            <LogOut className="h-4.5 w-4.5 group-hover:-translate-x-1 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64">
        <header className={`sticky top-0 z-40 flex h-16 items-center justify-between border-b ${currentTheme.border} ${currentTheme.card} px-8`}>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            {[...menuItems, ...toolItems].find(i => i.href === pathname)?.name || 'Administración'}
          </h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200">
            B
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>

      {/* MODAL DE LOGOUT (Tu base original pulida) */}
      <Transition show={showLogoutModal} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={() => setShowLogoutModal(false)}>
          
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-6 pb-8 pt-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-8 border border-slate-100">
                  
                  <div className="absolute right-5 top-5">
                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors"
                      onClick={() => setShowLogoutModal(false)}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-950 tracking-tight">
                        ¿Cerrar sesión ahora?
                      </Dialog.Title>
                      <p className="mt-2.5 text-sm text-slate-500 font-medium">
                        Tendrás que ingresar tus credenciales nuevamente para acceder al panel de TI Bodega.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer shadow-lg shadow-red-200 transition-all"
                    >
                      Sí, salir
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(false)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}