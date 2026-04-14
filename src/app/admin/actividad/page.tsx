'use client';

import { useState, useEffect } from 'react';
import { 
  Search, ArrowUpRight, ArrowDownLeft, 
  User, Calendar, Package, Loader2, Clock, ChevronLeft, ChevronRight,
  PlusCircle, Edit3, Trash2, Tag, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ITEMS_PER_PAGE = 15;

// Ampliamos los tipos soportados en la vista
type ActionType = 'TODOS' | 'SALIDA' | 'INGRESO' | 'CREACION' | 'EDICION' | 'ELIMINACION' | 'ETIQUETA';

export default function ActividadPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros
  const [filterTipo, setFilterTipo] = useState<ActionType>('TODOS');
  const [filterUsuario, setFilterUsuario] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Lista de usuarios únicos para el dropdown
  const [usuarios, setUsuarios] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    fetchActividad();

    // (Supabase Realtime)
    const channel = supabase
      .channel('actividad_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transacciones' },
        async (payload) => {
          // Cuando llega un nuevo registro, necesitamos buscar sus datos relacionados (perfil y hardware)
          const newTx = payload.new;
          
          const [{ data: perfil }, { data: hardware }] = await Promise.all([
            supabase.from('perfiles').select('email').eq('id', newTx.operador_id).single(),
            supabase.from('hardware').select('modelo').eq('id', newTx.hardware_id).single()
          ]);

          const txCompleta = {
            ...newTx,
            perfiles: perfil || { email: 'Desconocido' },
            hardware: hardware || { modelo: 'Desconocido' }
          };

          // Agregamos el nuevo movimiento al principio de la lista de forma reactiva
          setMovimientos(prev => [txCompleta, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset página al cambiar filtros
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTipo, filterUsuario]);

  const fetchActividad = async () => {
    setLoading(true);
    try {
      const { data: trans, error: transError } = await supabase
        .from('transacciones')
        .select('*')
        .order('timestamp', { ascending: false });

      if (transError) throw transError;

      const [{ data: perfiles }, { data: hardware }] = await Promise.all([
        supabase.from('perfiles').select('id, email'),
        supabase.from('hardware').select('id, modelo')
      ]);

      const dataFormateada = trans.map(t => ({
        ...t,
        perfiles: perfiles?.find(p => p.id === t.operador_id) || { email: 'Desconocido' },
        hardware: hardware?.find(h => h.id === t.hardware_id) || { modelo: 'Desconocido' }
      }));

      setMovimientos(dataFormateada);

      // Extraer usuarios únicos para el filtro
      const uniqueUsers = Array.from(
        new Map(
          (perfiles ?? [])
            .filter(p => trans.some(t => t.operador_id === p.id))
            .map(p => [p.id, p])
        ).values()
      );
      setUsuarios(uniqueUsers);

    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado combinado
  const filteredMovimientos = movimientos.filter(mov => {
    const matchSearch =
      mov.hardware?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.perfiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.notas?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === 'TODOS' || mov.tipo === filterTipo;
    const matchUsuario = !filterUsuario || mov.operador_id === filterUsuario;
    return matchSearch && matchTipo && matchUsuario;
  });

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredMovimientos.length / ITEMS_PER_PAGE));
  const paginatedMovimientos = filteredMovimientos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Helper para renderizar iconos y colores según el tipo
  const getActionStyles = (tipo: string) => {
    switch (tipo) {
      case 'SALIDA': return { icon: <ArrowUpRight className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Retiro de equipo', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700' };
      case 'INGRESO': return { icon: <ArrowDownLeft className="h-5 w-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Ingreso de equipo', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700' };
      case 'CREACION': return { icon: <PlusCircle className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Hardware Registrado', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700' };
      case 'ELIMINACION': return { icon: <Trash2 className="h-5 w-5" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: 'Hardware Eliminado', badgeBg: 'bg-red-100', badgeText: 'text-red-700' };
      case 'EDICION': return { icon: <Edit3 className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', label: 'Hardware Editado', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700' };
      case 'ETIQUETA': return { icon: <Tag className="h-5 w-5" />, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', label: 'Cambio de Etiqueta', badgeBg: 'bg-pink-100', badgeText: 'text-pink-700' };
      default: return { icon: <FileText className="h-5 w-5" />, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', label: 'Actividad General', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700' };
    }
  };

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial de Actividad</h1>
        <p className="text-sm text-slate-500">Registro detallado en tiempo real de movimientos, cambios y gestiones de hardware.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por equipo, correo, SKU o detalles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
        />
      </div>

      {!loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {(['TODOS', 'SALIDA', 'INGRESO', 'CREACION', 'EDICION', 'ELIMINACION', 'ETIQUETA'] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setFilterTipo(tipo)}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${
                  filterTipo === tipo
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tipo === 'TODOS' ? 'Todos' : tipo}
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Usuario:</span>
            <select
              value={filterUsuario}
              onChange={e => setFilterUsuario(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
            {filterUsuario && (
              <button onClick={() => setFilterUsuario('')} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer">
                Limpiar
              </button>
            )}
          </div>

          <span className="sm:ml-auto text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded-full w-fit">
            {filteredMovimientos.length} movs.
          </span>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="font-medium">Cargando la matrix de eventos...</p>
          </div>
        ) : paginatedMovimientos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Clock className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron movimientos.</p>
          </div>
        ) : (
          paginatedMovimientos.map((mov) => {
            const styles = getActionStyles(mov.tipo);
            return (
              <div
                key={mov.id}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0">
                  <div className={`mt-0.5 sm:mt-1 rounded-xl p-2.5 sm:p-3 shadow-sm shrink-0 border ${styles.bg} ${styles.color} ${styles.border}`}>
                    {styles.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                          {styles.label}
                        </span>
                        <span className="hidden sm:inline text-xs font-bold text-slate-300">•</span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {mov.sku || 'N/A'}
                        </span>
                      </div>
                      
                      {/* Badge Móvil (visible solo en pantallas pequeñas) */}
                      <div className="sm:hidden shrink-0 mt-0.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
                          {mov.tipo}
                        </span>
                      </div>
                    </div>

                    {mov.notas && (
                      <p className="text-xs sm:text-sm text-slate-600 mb-2 mt-1.5 sm:mt-0 italic leading-relaxed">
                        "{mov.notas}"
                      </p>
                    )}

                    <div className="mt-2.5 sm:mt-1.5 flex flex-col sm:flex-row sm:flex-wrap gap-y-1.5 gap-x-4 text-[11px] sm:text-sm text-slate-500">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 shrink-0" />
                        <span className="font-medium truncate">{mov.hardware?.modelo || 'Hardware eliminado/desconocido'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 w-fit">
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded-md">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                          <span className="font-semibold">{mov.perfiles?.email || 'Operador desconocido'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 shrink-0" />
                        <span className="capitalize">
                          {mov.timestamp ? format(new Date(mov.timestamp), "d MMM yyyy, HH:mm", { locale: es }) : 'Fecha no disponible'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badge Desktop (visible solo en PC) */}
                <div className="hidden sm:flex items-center justify-end shrink-0 ml-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
                    {mov.tipo}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {!loading && filteredMovimientos.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMovimientos.length)}</span>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-600 px-2">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}