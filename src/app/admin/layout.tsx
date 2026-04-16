'use client';

import React, { useState, Fragment, useEffect } from 'react';
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
import { usePresence } from '@/hooks/usePresence';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [userAvatar, setUserAvatar] = useState({ 
    initial: 'B', 
    styles: 'bg-blue-100 text-blue-700 border-blue-200' 
  });

  usePresence();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const namePart = user.email.split('@')[0].split('.')[0];
        const initial = namePart.charAt(0).toUpperCase();
        const isFemale = namePart.toLowerCase().endsWith('a');
        const styles = isFemale 
          ? 'bg-pink-100 text-pink-700 border-pink-200' 
          : 'bg-blue-100 text-blue-700 border-blue-200';
        setUserAvatar({ initial, styles });
      }
    };
    fetchUser();
  }, []);
  
  const menuItems = [
    { name: 'Panel Principal', href: '/admin', icon: LayoutDashboard },
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
      {/* Cabecera Sidebar */}
      <div className="flex shrink-0 items-center gap-2 px-4 2xl:px-5 pt-5 pb-3">
        <div className="flex h-7 w-7 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-200">
          <Package className="h-4 w-4 2xl:h-5 2xl:w-5" />
        </div>
        <span className="font-extrabold tracking-tight text-slate-900 text-sm 2xl:text-base leading-tight truncate">
          Bodega Informática
        </span>
      </div>
      
      <div className="flex flex-1 flex-col justify-between overflow-y-auto mt-2">
        {/* Navegación: Base chica (Mobile/Note), se agranda en 2xl (Monitores) */}
        <nav className="space-y-1 px-3 py-3">
          <p className="px-2 pb-2 text-[10px] 2xl:text-xs font-bold uppercase tracking-widest text-slate-400">Menú Principal</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 2xl:gap-3 rounded-xl px-3 py-2.5 2xl:py-3 text-xs 2xl:text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                }`}
              >
                <Icon className="h-4 w-4 2xl:h-5 2xl:w-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="px-3 pb-5">
          <Link
            href="/admin/configuracion"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 2xl:gap-3 rounded-xl px-3 py-2.5 2xl:py-3 text-xs 2xl:text-sm font-semibold transition-all duration-200 mb-3 ${
              pathname === '/admin/configuracion'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
            }`}
          >
            <Settings className="h-4 w-4 2xl:h-5 2xl:w-5 shrink-0" />
            <span className="truncate">Configuración</span>
          </Link>
          
          <div className="border-t border-slate-100 pt-3">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setShowLogoutModal(true);
              }}
              className="flex w-full items-center gap-2.5 2xl:gap-3 rounded-xl px-3 py-2.5 2xl:py-3 text-xs 2xl:text-sm font-bold text-red-500 hover:bg-red-50 cursor-pointer transition-colors group"
            >
              <LogOut className="h-4 w-4 2xl:h-5 2xl:w-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
              <span className="truncate">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`flex min-h-screen overflow-x-hidden ${currentTheme.background}`}>
        
        {/* Sidebar móvil (drawer) - Ancho cómodo para el dedo w-60 */}
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
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
            </Transition.Child>
            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-350 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-450 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative flex w-60 flex-col bg-white shadow-2xl overflow-hidden rounded-r-2xl">
                  <SidebarContent />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>

        {/* Sidebar escritorio - Note (md): w-52 (15% más chico) | Monitor (2xl): w-64 */}
        <aside className={`fixed inset-y-0 left-0 z-50 hidden md:flex flex-col border-r ${currentTheme.border} ${currentTheme.card} w-52 2xl:w-64 print:hidden`}>
          <SidebarContent />
        </aside>

        {/* Contenido principal - Paddings sincronizados (pl-52, 2xl:pl-64) */}
        <div className="flex flex-1 flex-col min-w-0 md:pl-52 2xl:pl-64 print:pl-0">
          
          {/* Header Responsivo - Note: h-14 | Monitor: h-16 */}
          <header className={`sticky top-0 z-40 flex items-center border-b ${currentTheme.border} ${currentTheme.card} px-4 sm:px-6 h-14 2xl:h-16 print:hidden`}>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-700 md:hidden hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex flex-1 items-center justify-between ml-3 md:ml-0 min-w-0">
              <h2 className="text-xs 2xl:text-sm font-bold uppercase tracking-widest text-slate-400 truncate pr-4 min-w-0">
                {pathname === '/admin/configuracion' 
                  ? 'Configuración' 
                  : menuItems.find(i => i.href === pathname)?.name || 'Administración'}
              </h2>
              
              <div className="flex shrink-0 items-center">
                <div className={`flex h-8 w-8 2xl:h-9 2xl:w-9 items-center justify-center rounded-full font-bold text-xs border shadow-sm select-none ${userAvatar.styles}`}>
                  {userAvatar.initial}
                </div>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 overflow-x-hidden">
            {children}
          </main>
        </div>

        {/* Modal Logout */}
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
                          ¿Cerrar sesión?
                        </Dialog.Title>
                        <p className="mt-2.5 text-sm text-slate-500 font-medium">
                          Tendrás que ingresar tus credenciales nuevamente.
                        </p>
                      </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-all cursor-pointer"
                      >
                        Sí, salir
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogoutModal(false)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
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
    </>
  );
}