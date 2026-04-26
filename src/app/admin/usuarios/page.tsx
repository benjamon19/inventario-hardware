'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Users, Shield, Search,
  CheckCircle2, Clock, ShieldCheck, Activity, Package,
  UserPlus, X, Mail, Lock, AlertCircle, Plus,
  ChevronLeft, ChevronRight, Ban, Power, Wifi
} from 'lucide-react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePresence } from '@/hooks/usePresence';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';

import { crearUsuarioDesdeAdmin } from '@/app/actions/usuarios';
import { registrarLog } from '@/lib/logger';
import { useAvatar, BANNER_PATTERNS, patternCSS } from '@/components/useAvatar';
import { Sk } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';

const SkeletonUserCard = () => (
  <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 shadow-sm gap-3">
    <div className="flex flex-col gap-3">
      <Sk className="h-12 w-12 rounded-[1.1rem] shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Sk className="h-4 w-40" />
        <Sk className="h-3.5 w-24" />
      </div>
    </div>
    <div className="flex items-center gap-2 mt-1">
      <Sk className="h-5 w-16 rounded-full" />
      <Sk className="h-5 w-14 rounded-full" />
    </div>
    <div className="flex gap-2 pt-1 border-t border-slate-100">
      <Sk className="h-7 flex-1 rounded-lg" />
      <Sk className="h-7 flex-1 rounded-lg" />
    </div>
  </div>
);

const PRIORIDAD_ROLES: Record<string, number> = {
  'SUPER_ADMIN': 1,
  'ADMIN': 2,
  'OPERADOR': 3,
  'PENDIENTE': 4
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const onlineUsers = usePresence();

  // Avatar del usuario actual (sincronizado con perfil)
  const {
    initials: myInitials,
    avatarGradient: myAvatarGradient,
    bannerGradient: myBannerGradient,
    bannerPattern: myBannerPattern
  } = useAvatar();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<'TODOS' | 'SUPER_ADMIN' | 'ADMIN' | 'OPERADOR' | 'PENDIENTE'>('TODOS');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(6);
      } else {
        const availableHeight = window.innerHeight - 300;
        const estimatedCardHeight = 150;
        const rows = Math.floor(availableHeight / estimatedCardHeight);
        const cols = window.innerWidth >= 1024 ? 3 : 2;
        setItemsPerPage(Math.max(6, rows * cols));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchMyIdentity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      const { data } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single();
      if (data) setCurrentUserRole(data.rol);
    };
    fetchMyIdentity();
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setLastUpdate(new Date());
  }, []);

  // ── Realtime real: escucha INSERT, UPDATE y DELETE en perfiles ──
  useRealtimeTable({
    table: 'perfiles',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    debounceMs: 800,
    onRefresh: triggerRefresh,
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRol]);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from('perfiles')
      .select('*', { count: 'estimated' })
      .range(from, to);

    if (searchTerm) query = query.ilike('email', `%${searchTerm}%`);
    if (filterRol !== 'TODOS') query = query.eq('rol', filterRol);

    const { data: perfilesData, count, error: perfilesError } = await query;

    if (perfilesError) {
      console.error('Error al cargar perfiles:', perfilesError);
      setLoading(false);
      return;
    }

    if (count !== null) setTotalItems(count);

    const userIds = perfilesData?.map(p => p.id) || [];
    let perfilesConStats = perfilesData || [];

    if (userIds.length > 0) {
      const { data: logsData } = await supabase
        .from('auditoria_logs')
        .select('usuario_id, created_at')
        .eq('entidad', 'HARDWARE')
        .in('usuario_id', userIds)
        .order('created_at', { ascending: false });

      const logsByUser = new Map<string, { total: number; ultima: string | null }>();
      logsData?.forEach(log => {
        const existing = logsByUser.get(log.usuario_id);
        if (!existing) {
          logsByUser.set(log.usuario_id, { total: 1, ultima: log.created_at });
        } else {
          existing.total++;
        }
      });

      perfilesConStats = perfilesData!.map(perfil => ({
        ...perfil,
        totalMovimientos: logsByUser.get(perfil.id)?.total ?? 0,
        ultimaActividad: logsByUser.get(perfil.id)?.ultima ?? null,
      }));
    }

    const myId = currentUserId;
    const usuariosOrdenados = perfilesConStats.sort((a, b) => {
      if (a.id === myId) return -1;
      if (b.id === myId) return 1;
      const prioridadA = PRIORIDAD_ROLES[a.rol] || 99;
      const prioridadB = PRIORIDAD_ROLES[b.rol] || 99;
      if (prioridadA !== prioridadB) return prioridadA - prioridadB;
      return (a.email || '').localeCompare(b.email || '');
    });

    setUsuarios(usuariosOrdenados);
    setLoading(false);
  }, [currentPage, itemsPerPage, searchTerm, filterRol, currentUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsuarios();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsuarios, refreshTrigger]);

  const cambiarRol = async (perfil: any, nuevoRol: string) => {
    setUpdatingId(perfil.id);
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', perfil.id);

    if (error) {
      alert('No se pudo actualizar el rol: ' + error.message);
    } else {
      await registrarLog('EDITAR', 'USUARIO', perfil.id, {
        email_afectado: perfil.email,
        rol_anterior: perfil.rol,
        rol_nuevo: nuevoRol
      });
      await fetchUsuarios(); // <--- RECARGA FORZADA AQUÍ
    }
    setUpdatingId(null);
  };

  const cambiarEstado = async (perfil: any, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    if (!confirm(`¿Estás seguro de que quieres ${nuevoEstado === 'INACTIVO' ? 'DESACTIVAR' : 'ACTIVAR'} al usuario ${perfil.email}?`)) return;
    setUpdatingId(perfil.id);
    const { error } = await supabase
      .from('perfiles')
      .update({ estado: nuevoEstado })
      .eq('id', perfil.id);

    if (error) {
      alert('No se pudo actualizar el estado: ' + error.message);
    } else {
      await registrarLog('EDITAR', 'USUARIO', perfil.id, {
        email_afectado: perfil.email,
        accion_estado: nuevoEstado
      });
      await fetchUsuarios(); // <--- RECARGA FORZADA AQUÍ
    }
    setUpdatingId(null);
  };

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateMsg(null);

    const res = await crearUsuarioDesdeAdmin(newEmail, newPassword);

    if (!res.success) {
      setCreateMsg({ type: 'error', text: res.error || 'Error desconocido' });
      setIsCreating(false);
      return;
    }

    await registrarLog('CREAR', 'USUARIO', null, {
      email_creado: newEmail,
      detalle: 'Usuario registrado desde panel administrativo'
    });

    setCreateMsg({ type: 'success', text: 'Usuario creado exitosamente.' });

    // Le damos un respiro muy cortito (500ms) para que el trigger de Supabase 
    // termine de crear el perfil antes de forzar la recarga
    setTimeout(async () => {
      await fetchUsuarios(); // <--- RECARGA FORZADA AQUÍ
      setIsModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setCreateMsg(null);
      setIsCreating(false);
    }, 500);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const handlePageChange = (newPage: number) => setCurrentPage(newPage);

  const paginationEl = !loading && totalItems > itemsPerPage ? (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
    />
  ) : null;

  const roles = ['TODOS', 'SUPER_ADMIN', 'ADMIN', 'OPERADOR', 'PENDIENTE'] as const;

  const rolChipClass = (rol: typeof roles[number], active: boolean) => {
    if (!active) return 'bg-white text-slate-600 border-slate-200 hover:border-slate-300';
    if (rol === 'SUPER_ADMIN') return 'bg-purple-600 text-white border-purple-600';
    if (rol === 'ADMIN') return 'bg-slate-900 text-white border-slate-900';
    if (rol === 'OPERADOR') return 'bg-emerald-600 text-white border-emerald-600';
    if (rol === 'PENDIENTE') return 'bg-amber-500 text-white border-amber-500';
    return 'bg-slate-900 text-white border-slate-900';
  };

  return (
    <div className="space-y-4 relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h1>
            {!loading && totalItems > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-900 border border-slate-200">
                {totalItems} {totalItems === 1 ? 'usuario' : 'usuarios'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">Controla el acceso y monitorea la actividad del personal.</p>
          </div>
          {lastUpdate && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              Última actualización: {format(lastUpdate, "HH:mm:ss", { locale: es })}
            </p>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 transition-all w-full sm:w-auto shrink-0 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            maxLength={100}
            autoComplete="off"
            placeholder="Buscar por correo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value.trimStart())}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {roles.map(rol => (
            <button
              key={rol}
              onClick={() => setFilterRol(rol)}
              className={`whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${rolChipClass(rol, filterRol === rol)}`}
            >
              {rol === 'SUPER_ADMIN' && <Shield className="h-3.5 w-3.5" />}
              {rol === 'ADMIN' && <ShieldCheck className="h-3.5 w-3.5" />}
              {rol === 'OPERADOR' && <CheckCircle2 className="h-3.5 w-3.5" />}
              {rol === 'PENDIENTE' && <Clock className="h-3.5 w-3.5" />}
              {rol === 'TODOS' ? 'Todos' : rol}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <>
            {Array(6).fill(0).map((_, i) => <SkeletonUserCard key={i} />)}
          </>
        ) : usuarios.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Users className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron usuarios.</p>
          </div>
        ) : (
          usuarios.map((perfil) => {
            const isOnline = perfil.id === currentUserId ? true : !!onlineUsers[perfil.id];
            const inactivo = perfil.estado === 'INACTIVO';
            const isUpdating = updatingId === perfil.id;

            return (
              <div
                key={perfil.id}
                className={`flex flex-col rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden ${isUpdating ? 'opacity-60 pointer-events-none' :
                  inactivo ? 'opacity-70 grayscale-[0.5] border-red-100 bg-slate-50' :
                    isOnline ? 'border-emerald-200 ring-1 ring-emerald-100/50' : 'border-slate-100 hover:border-slate-300'
                  }`}
              >
                {/* Banner */}
                {(!inactivo) && (
                  <div className={`relative h-14 bg-gradient-to-br ${perfil.id === currentUserId ? myBannerGradient : (perfil.banner_gradient || 'from-slate-100 to-slate-200')}`}>
                    {(perfil.id === currentUserId ? myBannerPattern : (perfil.banner_pattern || 'none')) !== 'none' && (
                      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay" style={{ backgroundImage: patternCSS(BANNER_PATTERNS.find(p => p.id === (perfil.id === currentUserId ? myBannerPattern : perfil.banner_pattern))?.svg || ''), backgroundRepeat: 'repeat' }} />
                    )}
                  </div>
                )}

                <div className="flex flex-col p-3 sm:p-4 relative">

                  {/* Contenedor del Avatar (se monta sobre el banner) */}
                  <div className={`${!inactivo ? '-mt-8 relative z-10 mb-2' : 'mb-2'}`}>
                    <div className="relative inline-block shrink-0">
                      <div
                        className={`flex ${!inactivo ? 'h-12 w-12 border-2 border-white shadow-md rounded-[1.1rem]' : 'h-10 w-10 border border-slate-300 rounded-xl bg-slate-200 text-slate-500'} items-center justify-center font-black text-xl bg-gradient-to-br ${inactivo
                          ? ''
                          : perfil.id === currentUserId
                            ? `${myAvatarGradient} text-white`
                            : perfil.avatar_gradient
                              ? `${perfil.avatar_gradient} text-white`
                              : perfil.rol === 'SUPER_ADMIN' ? 'from-purple-500 to-purple-700 text-white'
                                : perfil.rol === 'ADMIN' ? 'from-slate-800 to-slate-950 text-white'
                                  : 'from-slate-300 to-slate-400 text-slate-700'
                          }`}
                      >
                        {isUpdating
                          ? <div className="flex h-4 w-4 items-center justify-center"><TailChase size="16" speed="1.75" color="currentColor" /></div>
                          : perfil.id === currentUserId
                            ? myInitials
                            : perfil.avatar_initials
                              ? perfil.avatar_initials
                              : perfil.email?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`absolute ${!inactivo ? 'bottom-0 -right-1' : '-bottom-1 -right-1'} flex h-3 w-3 items-center justify-center rounded-full border-2 border-white ${inactivo ? 'bg-red-500' :
                        isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}>
                        {isOnline && !inactivo && (
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Textos y Badges (quedan abajo del avatar, completamente fuera del banner) */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-[15px] truncate ${inactivo ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {perfil.email}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${inactivo ? 'bg-slate-200 text-slate-600 border-slate-300' :
                        perfil.rol === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          perfil.rol === 'ADMIN' ? 'bg-slate-100 text-slate-900 border-slate-200' :
                            perfil.rol === 'OPERADOR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {perfil.rol.replace('_', ' ')}
                      </span>
                      {inactivo ? (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded text-red-600 bg-red-50 border border-red-100">
                          Inactivo
                        </span>
                      ) : isOnline && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded text-emerald-600 bg-emerald-50">
                          En línea
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resto del contenido (estadísticas, botones, etc) */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Package className="h-3 w-3" /> Movi.
                      </span>
                      <span className="font-bold text-slate-800">{perfil.totalMovimientos}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Actividad
                      </span>
                      <span className="font-bold text-slate-800 truncate">
                        {perfil.ultimaActividad
                          ? format(new Date(perfil.ultimaActividad), "d MMM, HH:mm", { locale: es })
                          : 'Nunca'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between border-t border-slate-50 pt-3 gap-2">
                    <p className="text-[9px] font-mono font-bold text-slate-300">
                      ID: {perfil.id.substring(0, 8)}
                    </p>

                    <div className="flex gap-1.5 ml-auto">
                      {perfil.id === currentUserId ? (
                        <span className="rounded-lg px-2 py-1 text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100">
                          Tu cuenta
                        </span>
                      ) : perfil.rol === 'SUPER_ADMIN' ? null : (
                        <>
                          {currentUserRole === 'SUPER_ADMIN' && (
                            <>
                              {inactivo ? (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => cambiarEstado(perfil, 'ACTIVO')}
                                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200 disabled:opacity-50"
                                >
                                  <Power className="h-3 w-3" /> Activar
                                </button>
                              ) : (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => cambiarEstado(perfil, 'INACTIVO')}
                                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-200 disabled:opacity-50"
                                >
                                  <Ban className="h-3 w-3" /> Desactivar
                                </button>
                              )}
                            </>
                          )}

                          {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') && !inactivo && (
                            <>
                              {perfil.rol !== 'OPERADOR' && (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => cambiarRol(perfil, 'OPERADOR')}
                                  className="rounded-lg px-2 py-1 text-[9px] font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer border border-slate-200 hover:border-emerald-200 disabled:opacity-50"
                                >
                                  A Operador
                                </button>
                              )}
                              {perfil.rol !== 'ADMIN' && (
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => cambiarRol(perfil, 'ADMIN')}
                                    className="rounded-lg px-2 py-1 text-[9px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 hover:border-slate-300 disabled:opacity-50"
                                  >
                                    A Admin
                                  </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {paginationEl}

      <div className="flex items-start gap-3 rounded-2xl bg-slate-100 border border-slate-200 p-4 mt-4">
        <Shield className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-slate-900">Niveles de Acceso</h4>
          <p className="text-xs font-medium text-slate-700 mt-1 opacity-90 leading-relaxed">
            El <strong>Super Admin</strong> tiene control total de las cuentas. Los <strong>Administradores</strong> ven estadísticas y configuraciones. Los <strong>Operadores</strong> gestionan el escaneo en bodega.
          </p>
        </div>
      </div>

      {/* Modal creación */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isCreating && setIsModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px]" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-6 pb-8 pt-6 text-left shadow-2xl sm:my-8 sm:w-full sm:max-w-md sm:p-8 border border-slate-100">
                  <div className="absolute right-5 top-5">
                    <button
                      type="button"
                      disabled={isCreating}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors disabled:opacity-50"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 border border-slate-200">
                      <UserPlus className="h-7 w-7" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-950 tracking-tight">
                        Nuevo Usuario
                      </Dialog.Title>
                      <p className="mt-2.5 text-sm text-slate-500 font-medium">
                        Ingresa el correo y contraseña.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={crearUsuario} className="mt-8 space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          maxLength={100}
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value.trim())}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10 transition-colors"
                          placeholder="ejemplo@empresa.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">Contraseña</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          required
                          maxLength={100}
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10 transition-all cursor-pointer"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                    </div>

                    {createMsg && (
                      <div className={`flex items-start gap-2 rounded-xl p-3 border mt-4 ${createMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
                        }`}>
                        {createMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                        <p className="text-xs font-semibold leading-relaxed">{createMsg.text}</p>
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isCreating || !newEmail || !newPassword}
                        className="w-full flex justify-center items-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isCreating ? (
                          <><div className="flex h-5 w-5 items-center justify-center"><TailChase size="20" speed="1.75" color="white" /></div><span>Creando...</span></>
                        ) : (
                          <><Plus className="h-5 w-5" /><span>Registrar Usuario</span></>
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}