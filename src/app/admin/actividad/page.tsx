'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, ArrowUpRight, ArrowDownLeft,
  User, Calendar, Package, Clock, ChevronLeft, ChevronRight,
  PlusCircle, Edit3, Trash2, Tag, FileText, ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { registrarLog } from '@/lib/logger';
import { Sk } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';

const SkeletonLogRow = () => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4 shadow-sm">
    <Sk className="h-9 w-9 rounded-xl shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Sk className="h-4 w-28" />
        <Sk className="h-3.5 w-16 rounded-full" />
      </div>
      <Sk className="h-3 w-48" />
      <div className="flex gap-1.5">
        <Sk className="h-4 w-20 rounded-full" />
        <Sk className="h-4 w-16 rounded-full" />
      </div>
    </div>
    <div className="shrink-0 text-right flex flex-col gap-1.5">
      <Sk className="h-3 w-20 ml-auto" />
      <Sk className="h-5 w-14 rounded-full ml-auto" />
    </div>
  </div>
);

type ActionType = 'TODOS' | 'SALIDA' | 'INGRESO' | 'CREACION' | 'EDICION' | 'ELIMINACION' | 'ETIQUETA';

export default function ActividadPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [filterTipo, setFilterTipo] = useState<ActionType>('TODOS');
  const [filterUsuario, setFilterUsuario] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [usuarios, setUsuarios] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const { data } = await supabase.from('perfiles').select('id, email').order('email');
      if (data) setUsuarios(data);
    };
    fetchUsuarios();
  }, []);


  // ── Realtime: INSERT en auditoria_logs ──
  useRealtimeTable({
    table: 'auditoria_logs',
    events: ['INSERT'],
    debounceMs: 1500,
    onRefresh: useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
    }, []),
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTipo, filterUsuario]);

  useEffect(() => {
    const calcularItemsPorPagina = () => {
      setItemsPerPage(window.innerWidth >= 768 ? 12 : 6);
    };
    calcularItemsPorPagina();
    window.addEventListener('resize', calcularItemsPorPagina);
    return () => window.removeEventListener('resize', calcularItemsPorPagina);
  }, []);

  useEffect(() => {
    const fetchActividad = async () => {
      setLoading(true);

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('auditoria_logs')
        .select(`*, perfiles:usuario_id (id, email)`, { count: 'estimated' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filterTipo !== 'TODOS') {
        let dbTipo: string = filterTipo;
        if (filterTipo === 'CREACION') dbTipo = 'CREAR';
        if (filterTipo === 'EDICION') dbTipo = 'EDITAR';
        if (filterTipo === 'ELIMINACION') dbTipo = 'ELIMINAR';
        query = query.eq('accion', dbTipo);
      }

      if (filterUsuario) {
        query = query.eq('usuario_id', filterUsuario);
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchingUsers = usuarios.filter(u => u.email.toLowerCase().includes(term)).map(u => u.id);
        let orQuery = `detalles->>modelo.ilike.%${term}%,detalles->>nombre.ilike.%${term}%,detalles->>sku.ilike.%${term}%,detalles->>numero_serie.ilike.%${term}%,detalles->>email_afectado.ilike.%${term}%`;
        if (matchingUsers.length > 0) {
          orQuery += `,usuario_id.in.(${matchingUsers.join(',')})`;
        }
        query = query.or(orQuery);
      }

      const { data: logs, count, error } = await query;

      if (!error && logs) {
        const dataFormateada = logs.map(log => {
          let tipoNormalizado = log.accion;
          if (log.accion === 'CREAR') tipoNormalizado = 'CREACION';
          if (log.accion === 'EDITAR') tipoNormalizado = 'EDICION';
          if (log.accion === 'ELIMINAR') tipoNormalizado = 'ELIMINACION';

          return {
            id: log.id,
            tipo: tipoNormalizado,
            entidad: log.entidad,
            timestamp: log.created_at,
            notas: log.detalles?.notas || null,
            sku: log.detalles?.sku || null,
            operador_id: log.usuario_id,
            perfiles: Array.isArray(log.perfiles) ? log.perfiles[0] : (log.perfiles || { email: 'Sistema' }),
            detalles: log.detalles,
            hardware: { 
              modelo: log.detalles?.modelo || log.detalles?.nombre || null,
              numero_serie: log.detalles?.numero_serie || null
            }
          };
        });

        setMovimientos(dataFormateada);
        if (count !== null) setTotalItems(count);
      }
      setLoading(false);
    };

    const delayDebounceFn = setTimeout(() => {
      fetchActividad();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, itemsPerPage, searchTerm, filterTipo, filterUsuario, refreshTrigger, usuarios]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const handlePageChange = (newPage: number) => setCurrentPage(newPage);

  const tipos = ['TODOS', 'INGRESO', 'SALIDA', 'CREACION', 'EDICION', 'ELIMINACION', 'ETIQUETA'] as const;

  const tipoChipClass = (tipo: ActionType, active: boolean) => {
    if (!active) return 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300';
    switch (tipo) {
      case 'INGRESO': return 'bg-emerald-600 text-white border-emerald-600';
      case 'SALIDA': return 'bg-amber-500 text-white border-amber-500';
      case 'CREACION': return 'bg-slate-900 text-white border-slate-900';
      case 'ELIMINACION': return 'bg-red-600 text-white border-red-600';
      case 'EDICION': return 'bg-purple-600 text-white border-purple-600';
      case 'ETIQUETA': return 'bg-pink-600 text-white border-pink-600';
      default: return 'bg-slate-900 text-white border-slate-900';
    }
  };

  const getActionStyles = (mov: any) => {
    const tipo = mov.tipo;
    const entidad = mov.entidad;

    if (entidad === 'USUARIO') return { icon: <User className="h-4 w-4" />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', label: 'Gestión de Usuario' };
    switch (tipo) {
      case 'SALIDA': return { icon: <ArrowUpRight className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Retiro de equipo' };
      case 'INGRESO': return { icon: <ArrowDownLeft className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Ingreso de equipo' };
      case 'CREACION': return { icon: <PlusCircle className="h-4 w-4" />, color: 'text-slate-900', bg: 'bg-slate-100', border: 'border-slate-200', label: 'Registro Nuevo' };
      case 'ELIMINACION': return { icon: <Trash2 className="h-4 w-4" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: 'Eliminación' };
      case 'EDICION': return { icon: <Edit3 className="h-4 w-4" />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', label: 'Modificación' };
      case 'ETIQUETA': return { icon: <Tag className="h-4 w-4" />, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', label: 'Cambio de Etiqueta' };
      default: return { icon: <FileText className="h-4 w-4" />, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', label: 'Actividad General' };
    }
  };

  const paginationEl = !loading && totalItems > itemsPerPage ? (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
    />
  ) : null;

  return (
    <div className="space-y-4 relative w-full">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de Actividad</h1>
        </div>
        <p className="text-sm text-slate-500">Registro detallado de movimientos, cambios y gestiones.</p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar equipo, usuario, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-900 transition-all shadow-sm"
            />
          </div>

          <div className="relative w-full sm:w-64 sm:ml-auto">
            <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={filterUsuario}
              onChange={e => setFilterUsuario(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-slate-900 transition-all cursor-pointer shadow-sm"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full pt-1">
          {tipos.map(tipo => (
            <button
              key={tipo}
              onClick={() => setFilterTipo(tipo)}
              className={`whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${tipoChipClass(tipo, filterTipo === tipo)}`}
            >
              {tipo === 'TODOS' ? 'Todos' : tipo}
            </button>
          ))}
        </div>
      </div>

      {paginationEl}

      <div className="space-y-3 w-full">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array(5).fill(0).map((_, i) => <SkeletonLogRow key={i} />)}
          </div>
        ) : movimientos.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Clock className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <p className="text-slate-500 font-medium">Sin actividad registrada.</p>
          </div>
        ) : (
          movimientos.map((mov) => {
            const styles = getActionStyles(mov);
            return (
              <div
                key={mov.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 group w-full"
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  <div className={`rounded-xl p-2.5 shadow-inner border shrink-0 ${styles.bg} ${styles.color} ${styles.border}`}>
                    {styles.icon}
                  </div>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-800 text-sm leading-tight">
                        {styles.label}
                      </span>
                      {mov.sku && (
                        <div className="flex gap-1 items-center">
                          <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {mov.sku}
                          </span>
                          {mov.hardware?.numero_serie && (
                            <span className="text-[9px] font-mono font-bold text-slate-400">
                              SN: {mov.hardware.numero_serie}
                            </span>
                          )}
                        </div>
                      )}
                      <span className={`sm:hidden ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${tipoChipClass(mov.tipo as ActionType, true)}`}>
                        {mov.tipo}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-snug truncate">
                      {mov.entidad === 'USUARIO' ? (
                        <>Rol de <strong>{mov.detalles?.email_afectado}</strong> a <strong>{mov.detalles?.rol_nuevo}</strong></>
                      ) : (
                        mov.notas ? `"${mov.notas}"` : 'Acción registrada.'
                      )}
                    </p>

                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                      {mov.hardware?.modelo && (
                        <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-100 text-slate-600 font-semibold">
                          <Package className="h-3 w-3 shrink-0 opacity-50" />
                          <span className="truncate max-w-30">{mov.hardware.modelo}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200 text-slate-900 font-bold">
                        <User className="h-3 w-3 shrink-0 opacity-50" />
                        <span className="truncate max-w-30">{mov.perfiles?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0 w-full sm:w-auto">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span className="text-[10px] font-semibold whitespace-nowrap">
                      {mov.timestamp ? format(new Date(mov.timestamp), "d MMM, HH:mm", { locale: es }) : '-'}
                    </span>
                  </div>
                  <span className={`hidden sm:inline-block mt-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${tipoChipClass(mov.tipo as ActionType, true)}`}>
                    {mov.tipo}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {paginationEl}
    </div>
  );
}