'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Shield, Search,
  CheckCircle2, Clock, ShieldCheck, Loader2, Activity, Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePresence } from '@/hooks/usePresence';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Hook de presencia (Usuarios Online)
  const onlineUsers = usePresence();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<'TODOS' | 'ADMIN' | 'OPERADOR' | 'PENDIENTE'>('TODOS');

  useEffect(() => {
    fetchUsuarios();

    // 🔴 SUSCRIPCIÓN EN TIEMPO REAL (Actualiza stats y nuevos usuarios automáticamente)
    const channel = supabase
      .channel('usuarios_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'perfiles' }, () => {
        fetchUsuarios(); // Si cambia un rol o entra un nuevo usuario
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transacciones' }, () => {
        fetchUsuarios(); // Si alguien escanea algo, actualiza su "última actividad"
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

    const { data: transaccionesData } = await supabase
      .from('transacciones')
      .select('operador_id, timestamp');

    const perfilesConStats = perfilesData?.map(perfil => {
      const misMovimientos = transaccionesData?.filter(t => t.operador_id === perfil.id) || [];
      const ordenados = [...misMovimientos].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return {
        ...perfil,
        totalMovimientos: misMovimientos.length,
        ultimaActividad: ordenados.length > 0 ? ordenados[0].timestamp : null
      };
    }) || [];

    setUsuarios(perfilesConStats);
    setLoading(false);
  };

  const cambiarRol = async (userId: string, nuevoRol: string) => {
    setUpdatingId(userId);
    const { error } = await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', userId);
    if (error) alert('No se pudo actualizar el rol: ' + error.message);
    // No necesitamos llamar a fetchUsuarios() aquí porque el realtime lo hará por nosotros
    setUpdatingId(null);
  };

  // Filtrado
  const filteredUsuarios = usuarios.filter(perfil => {
    const matchSearch = perfil.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = filterRol === 'TODOS' || perfil.rol === filterRol;
    return matchSearch && matchRol;
  });

  const roles = ['TODOS', 'ADMIN', 'OPERADOR', 'PENDIENTE'] as const;

  const rolChipClass = (rol: typeof roles[number], active: boolean) => {
    if (!active) return 'bg-white text-slate-600 border-slate-200 hover:border-slate-300';
    if (rol === 'ADMIN') return 'bg-blue-600 text-white border-blue-600';
    if (rol === 'OPERADOR') return 'bg-emerald-600 text-white border-emerald-600';
    if (rol === 'PENDIENTE') return 'bg-amber-500 text-white border-amber-500';
    return 'bg-slate-900 text-white border-slate-900';
  };

  return (
    <div className="space-y-6 relative">
      {/* Header unificado con las demás vistas */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h1>
        <p className="text-sm text-slate-500">Controla el acceso y monitorea la actividad del personal en tiempo real.</p>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Buscador */}
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

        {/* Filtro por rol */}
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

        {/* Contador */}
        {!loading && (
          <span className="ml-auto text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded-full whitespace-nowrap">
            {filteredUsuarios.length} de {usuarios.length} usu.
          </span>
        )}
      </div>

      {/* Grid de usuarios (Alineado a 3 columnas en pantallas grandes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="font-medium">Cargando personal...</p>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron usuarios.</p>
          </div>
        ) : (
          filteredUsuarios.map((perfil) => {
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
                            onClick={() => cambiarRol(perfil.id, 'OPERADOR')}
                            className="rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer border border-slate-200 hover:border-emerald-200 disabled:opacity-50"
                          >
                            Hacer Operador
                          </button>
                        )}
                        {perfil.rol !== 'ADMIN' && (
                          <button
                            disabled={updatingId === perfil.id}
                            onClick={() => cambiarRol(perfil.id, 'ADMIN')}
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

      {/* Info niveles */}
      <div className="flex items-start gap-3 rounded-3xl bg-blue-50 border border-blue-100 p-5 mt-8">
        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Niveles de Acceso</h4>
          <p className="text-xs font-medium text-blue-700 mt-1 opacity-90 leading-relaxed">
            Los <strong>Administradores</strong> pueden ver estadísticas y modificar configuraciones. Los <strong>Operadores</strong> solo tienen acceso a la herramienta de escaneo de bodega.
          </p>
        </div>
      </div>
    </div>
  );
}