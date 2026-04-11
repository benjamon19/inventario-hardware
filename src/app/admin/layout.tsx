'use client';

import React, { useState, Fragment } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { 
  LayoutDashboard, Box, History, Users, LogOut, 
  Package, AlertCircle, X, Settings, QrCode,
  Menu, ScanLine 
} from 'lucide-react';
import { currentTheme } from '@/config/theme';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Inventario', href: '/admin/inventario', icon: Box },
    { name: 'Generar QR', href: '/admin/generar-qr', icon: QrCode },
    { name: 'Escáner', href: '/admin/escaner', icon: ScanLine },
    { name: 'Actividad', href: '/admin/actividad', icon: History },
    { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* HEADER DEL MENÚ - Sin línea negra y con logo mejorado */}
      <div className="flex h-24 shrink-0 items-center gap-3 px-6 pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
          <Package className="h-5 w-5" />
        </div>
        <span className="font-extrabold tracking-tight text-slate-900 text-xl">TI Bodega</span>
      </div>
      
      <div className="flex flex-1 flex-col justify-between overflow-y-auto">
        <nav className="space-y-1.5 px-4 py-4">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Menú Principal</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-6">
          <Link
            href="/admin/configuracion"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 mb-3 ${
              pathname === '/admin/configuracion'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
            }`}
          >
            <Settings className="h-5 w-5" />
            Configuración
          </Link>
          
          <div className="border-t border-slate-100 pt-3">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setShowLogoutModal(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 cursor-pointer transition-colors group"
            >
              <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen ${currentTheme.background}`}>
      
      {/* 📱 SIDEBAR MÓVIL REDISEÑADO PREMIUM */}
      <Transition show={isMobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={setIsMobileMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* Fondo con desenfoque estilo cristal */}
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              {/* Panel con bordes muy redondeados a la derecha */}
              <Dialog.Panel className="relative flex w-70 flex-col bg-white shadow-2x1 overflow-hidden">
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* 💻 SIDEBAR DESKTOP */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r ${currentTheme.border} ${currentTheme.card} hidden md:flex flex-col`}>
        <SidebarContent />
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex flex-1 flex-col md:pl-72">
        
        {/* HEADER SUPERIOR */}
        <header className={`sticky top-0 z-40 flex h-20 items-center gap-x-4 border-b ${currentTheme.border} ${currentTheme.card} px-4 shadow-sm sm:gap-x-6 sm:px-8`}>
          <button
            type="button"
            className="-m-2.5 p-2.5 text-slate-700 md:hidden hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="sr-only">Abrir menú</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
              {pathname === '/admin/configuracion' 
                ? 'Configuración' 
                : menuItems.find(i => i.href === pathname)?.name || 'Administración'}
            </h2>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm border border-blue-200 shadow-sm cursor-pointer hover:bg-blue-200 transition-colors">
              B
            </div>
          </div>
        </header>

        {/* CONTENIDO DE LA PÁGINA */}
        <main className="p-4 sm:p-8">
          {children}
        </main>
      </div>

      {/* MODAL DE LOGOUT */}
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