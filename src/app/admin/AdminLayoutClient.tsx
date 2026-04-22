'use client';

import React, { useState, Fragment, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { 
  LayoutDashboard, Box, History, Users, LogOut, 
  Package, AlertCircle, Settings, QrCode,
  Menu, ScanLine 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePresence } from '@/hooks/usePresence';

const MOBILE_BREAKPOINT = 768;

export default function AdminLayoutClient({ 
  children, 
  initialExpanded 
}: { 
  children: React.ReactNode;
  initialExpanded: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Inicializamos directamente con lo que el servidor nos manda por las Cookies
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(initialExpanded);

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

  // Al hacer clic, cambiamos el estado y lo guardamos en una Cookie por 1 año
  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => {
      const next = !prev;
      document.cookie = `ti_bodega_sidebar_expanded=${next}; path=/; max-age=31536000`;
      return next;
    });
  };
  
  const menuItems = useMemo(() => [
    { name: 'Panel Principal', href: '/admin',             icon: LayoutDashboard },
    { name: 'Inventario',      href: '/admin/inventario', icon: Box             },
    { name: 'Generar QR',      href: '/admin/generar-qr', icon: QrCode          },
    { name: 'Escáner',         href: '/admin/escaner',    icon: ScanLine        },
    { name: 'Actividad',       href: '/admin/actividad',  icon: History         },
    { name: 'Usuarios',        href: '/admin/usuarios',   icon: Users           },
  ], []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-center gap-2 px-4 pt-5 pb-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Package className="h-4 w-4" />
        </div>
        <span className={`font-extrabold tracking-tight text-sm leading-tight whitespace-nowrap overflow-hidden transition-all duration-300 text-slate-900 ${
          collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
        }`}>
          Bodega Informática
        </span>
      </div>
      
      <div className="flex flex-1 flex-col justify-between overflow-y-auto mt-2">
        <nav className="space-y-1 px-3 py-3">
          <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'max-h-0 opacity-0' : 'max-h-7 opacity-100'}`}>
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Menú Principal
            </p>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={`text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-5">
          <Link
            href="/admin/configuracion"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200 mb-3 ${
              pathname === '/admin/configuracion' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className={`text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
            }`}>
              Configuración
            </span>
          </Link>
          
          <div className="border-t border-slate-100 pt-3">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors group cursor-pointer text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              <span className={`text-xs font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${
                collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
              }`}>
                Cerrar Sesión
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-50 transition-colors duration-300">
      
      {/* Sidebar móvil */}
      <Transition show={isMobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={setIsMobileMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0" enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full" enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0" leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-64 flex-col shadow-2xl border-r border-slate-200 bg-white">
                <SidebarContent collapsed={false} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Sidebar escritorio */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 hidden md:flex flex-col border-r border-slate-200 bg-white
        ${isSidebarExpanded ? 'w-52' : 'w-16'}
        transition-all duration-300 ease-in-out overflow-hidden print:hidden
      `}>
        <SidebarContent collapsed={!isSidebarExpanded} />
      </aside>

      {/* Contenido principal */}
      <div className={`
        flex flex-1 flex-col min-w-0 ${isSidebarExpanded ? 'md:pl-52' : 'md:pl-16'}
        transition-all duration-300 ease-in-out print:pl-0
      `}>

        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center border-b border-slate-200 bg-white px-3 sm:px-5 h-14 2xl:h-16 print:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors cursor-pointer text-slate-500 hover:bg-slate-50"
            onClick={() => {
              if (window.innerWidth < MOBILE_BREAKPOINT) {
                setIsMobileMenuOpen(true);
              } else {
                toggleSidebar();
              }
            }}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center justify-between ml-3 min-w-0">
            <h2 className="text-xs font-bold uppercase tracking-widest truncate pr-4 text-slate-400">
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

        <main className="p-4 sm:p-5 2xl:p-8 print:p-0">
          {children}
        </main>
      </div>

      {/* Modal Logout */}
      <Transition show={showLogoutModal} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={() => setShowLogoutModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200"  leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl p-6 sm:p-8 text-left shadow-2xl transition-all w-full max-w-sm border border-slate-200 bg-white">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-bold leading-6 tracking-tight text-slate-900">
                        ¿Cerrar sesión?
                      </Dialog.Title>
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Tendrás que ingresar tus credenciales nuevamente.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-3 text-sm font-semibold text-white transition-all cursor-pointer"
                    >
                      Sí, salir
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(false)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold transition-all cursor-pointer text-slate-500 hover:bg-slate-50"
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