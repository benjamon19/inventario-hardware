'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { 
  Users, Shield, Search,
  CheckCircle2, Clock, ShieldCheck, Loader2, Activity, Package,
  UserPlus, X, Mail, Lock, AlertCircle, Plus,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePresence } from '@/hooks/usePresence';
import { crearUsuarioDesdeAdmin } from '@/app/actions/usuarios';
import { registrarLog } from '@/lib/logger';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const onlineUsers = usePresence();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<'TODOS' | 'ADMIN' | 'OPERADOR' | 'PENDIENTE'>('TODOS');

  // --- ESTADOS DE PAGINACIÓN Y REFS ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsuarios();

    const channel = supabase
      .channel('usuarios_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'perfiles' }, () => {
        fetchUsuarios(); 
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auditoria_logs' }, () => {
        fetchUsuarios(); // Escuchamos cambios en la bitácora también
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Efecto: Cálculo dinámico de ítems por página (Grid Edition) ---
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(5); // Móvil: 5 tarjetas
      } else {
        // Escritorio: Calculamos filas estimadas por columnas (grid)
        const availableHeight = window.innerHeight - 320; 
        const estimatedCardHeight = 180; 
        const rows = Math.floor(availableHeight / estimatedCardHeight);
        const cols = window.innerWidth >= 1024 ? 3 : 2; // lg: 3 columnas, md: 2 columnas
        setItemsPerPage(Math.max(6, rows * cols)); // Mínimo 6 para que se vea bien
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Volver a la página 1 al filtrar o buscar
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRol]);

  const fetchUsuarios = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    const { data: perfilesData, error: perfilesError } = await supabase
      .from('perfiles')
      .select('*')
      .order('rol', { ascending: true });

    if (perfilesError) {
      console.error('Error al cargar perfiles:', perfilesError);
      setLoading(false);
      return;
    }

    // Buscamos la actividad desde la nueva tabla de auditoría para las stats
    const { data: logsData } = await supabase
      .from('auditoria_logs')
      .select('usuario_id, created_at')
      .eq('entidad', 'HARDWARE');

    const perfilesConStats = perfilesData?.map(perfil => {
      const misMovimientos = logsData?.filter(l => l.usuario_id === perfil.id) || [];
      const ordenados = [...misMovimientos].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        ...perfil,
        totalMovimientos: misMovimientos.length,
        ultimaActividad: ordenados.length > 0 ? ordenados[0].created_at : null
      };
    }) || [];

    setUsuarios(perfilesConStats);
    setLoading(false);
  };

  const cambiarRol = async (perfil: any, nuevoRol: string) => {
    setUpdatingId(perfil.id);
    
    // 1. Actualizar en la DB
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', perfil.id);

    if (error) {
      alert('No se pudo actualizar el rol: ' + error.message);
    } else {
      // 2. Registrar en la bitácora de auditoría
      await registrarLog('EDITAR', 'USUARIO', perfil.id, {
        email_afectado: perfil.email,
        rol_anterior: perfil.rol,
        rol_nuevo: nuevoRol
      });
      
      // 3. Recarga local inmediata
      fetchUsuarios();
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

    // Registramos la creación en el log
    await registrarLog('CREAR', 'USUARIO', null, {
      email_creado: newEmail,
      detalle: 'Usuario registrado desde panel administrativo'
    });

    setCreateMsg({ type: 'success', text: 'Usuario creado exitosamente.' });
    
    setTimeout(() => {
      setIsModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setCreateMsg(null);
      fetchUsuarios();
    }, 1500);

    setIsCreating(false);
  };

  const filteredUsuarios = usuarios.filter(perfil => {
    const matchSearch = perfil.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = filterRol === 'TODOS' || perfil.rol === filterRol;
    return matchSearch && matchRol;
  });

  // --- LÓGICA DE CORTADO (SLICE) PARA LA PAGINACIÓN ---
  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / itemsPerPage));
  const paginatedUsuarios = filteredUsuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // --- FUNCIÓN REUTILIZABLE DE PAGINACIÓN ---
  const renderPaginacion = () => {
    if (loading || filteredUsuarios.length <= itemsPerPage) return null;
    return (
      <div className="border border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-sm my-4">
        <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
          Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredUsuarios.length)}</span> de <span className="font-bold text-slate-700">{filteredUsuarios.length}</span> registros
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
              if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === '...' ? (
                <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">…</span>
              ) : (
                <button key={p} onClick={() => handlePageChange(p as number)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                  {p}
                </button>
              )
            )}
          <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const roles = ['TODOS', 'ADMIN', 'OPERADOR', 'PENDIENTE'] as const;

  const rolChipClass = (rol: typeof roles[number], active: boolean) => {
    if (!active) return 'bg-white text-slate-600 border-slate-200 hover:border-slate-300';
    if (rol === 'ADMIN') return 'bg-blue-600 text-white border-blue-600';
    if (rol === 'OPERADOR') return 'bg-emerald-600 text-white border-emerald-600';
    if (rol === 'PENDIENTE') return 'bg-amber-500 text-white border-amber-500';
    return 'bg-slate-900 text-white border-slate-900';
  };

  return (
    <div ref={topRef} className="space-y-6 relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500">Controla el acceso y monitorea la actividad del personal en tiempo real.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all w-full sm:w-auto shrink-0 cursor-pointer"
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
            placeholder="Buscar por correo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {roles.map(rol => (
            <button
              key={rol}
              onClick={() => setFilterRol(rol)}
              className={`whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${rolChipClass(rol, filterRol === rol)}`}
            >
              {rol === 'ADMIN' && <ShieldCheck className="h-3.5 w-3.5" />}
              {rol === 'OPERADOR' && <CheckCircle2 className="h-3.5 w-3.5" />}
              {rol === 'PENDIENTE' && <Clock className="h-3.5 w-3.5" />}
              {rol === 'TODOS' ? 'Todos' : rol}
            </button>
          ))}
        </div>

        {!loading && (
          <span className="ml-auto text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded-full whitespace-nowrap">
            {filteredUsuarios.length} de {usuarios.length} usu.
          </span>
        )}
      </div>

      {/* Paginación Arriba */}
      {renderPaginacion()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="font-medium">Cargando personal...</p>
          </div>
        ) : paginatedUsuarios.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron usuarios.</p>
          </div>
        ) : (
          paginatedUsuarios.map((perfil) => {
            const isOnline = perfil.id === currentUserId ? true : !!onlineUsers[perfil.id];

            return (
              <div
                key={perfil.id}
                className={`flex flex-col rounded-3xl border bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300 group ${
                  isOnline ? 'border-emerald-200 ring-1 ring-emerald-100/50' : 'border-slate-100 hover:border-blue-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-lg shadow-inner border ${
                      perfil.rol === 'ADMIN' ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {perfil.email?.substring(0, 1).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white ${
                      isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}>
                      {isOnline && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      )}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base truncate">{perfil.email}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                        perfil.rol === 'ADMIN'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : perfil.rol === 'OPERADOR'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {perfil.rol}
                      </span>
                      {isOnline && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-emerald-600 bg-emerald-50">
                          En línea
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Package className="h-3 w-3" /> Movi.
                    </span>
                    <span className="font-bold text-slate-800">{perfil.totalMovimientos}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Actividad
                    </span>
                    <span className="font-bold text-slate-800 truncate">
                      {perfil.ultimaActividad
                        ? format(new Date(perfil.ultimaActividad), "d MMM, HH:mm", { locale: es })
                        : 'Nunca'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                  <p className="text-[9px] font-mono font-bold text-slate-300">
                    ID: {perfil.id.substring(0, 8)}
                  </p>
                  <div className="flex gap-2">
                    {perfil.id === currentUserId ? (
                      <span className="rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100">
                        Tu cuenta
                      </span>
                    ) : (
                      <>
                        {perfil.rol !== 'OPERADOR' && (
                          <button
                            disabled={updatingId === perfil.id}
                            onClick={() => cambiarRol(perfil, 'OPERADOR')}
                            className="rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer border border-slate-200 hover:border-emerald-200 disabled:opacity-50"
                          >
                            Hacer Operador
                          </button>
                        )}
                        {perfil.rol !== 'ADMIN' && (
                          <button
                            disabled={updatingId === perfil.id}
                            onClick={() => cambiarRol(perfil, 'ADMIN')}
                            className="rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer border border-slate-200 hover:border-blue-200 disabled:opacity-50"
                          >
                            Hacer Admin
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación Abajo */}
      {renderPaginacion()}

      <div className="flex items-start gap-3 rounded-3xl bg-blue-50 border border-blue-100 p-5 mt-8">
        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Niveles de Acceso</h4>
          <p className="text-xs font-medium text-blue-700 mt-1 opacity-90 leading-relaxed">
            Los <strong>Administradores</strong> pueden ver estadísticas y modificar configuraciones. Los <strong>Operadores</strong> solo tienen acceso a la herramienta de escaneo de bodega.
          </p>
        </div>
      </div>

      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isCreating && setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
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
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
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
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-colors"
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
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                    </div>

                    {createMsg && (
                      <div className={`flex items-start gap-2 rounded-xl p-3 border mt-4 ${
                        createMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
                      }`}>
                        {createMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                        <p className="text-xs font-semibold leading-relaxed">{createMsg.text}</p>
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isCreating || !newEmail || !newPassword}
                        className="w-full flex justify-center items-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Creando...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-5 w-5" />
                            <span>Registrar Usuario</span>
                          </>
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