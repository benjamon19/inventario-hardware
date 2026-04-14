'use client';

import { useState, useEffect } from 'react';
import { 
  Search, ArrowUpRight, ArrowDownLeft, 
  User, Calendar, Package, Loader2, Clock, ChevronLeft, ChevronRight,
  PlusCircle, Edit3, Trash2, Tag, FileText, Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ITEMS_PER_PAGE = 15;

type ActionType = 'TODOS' | 'SALIDA' | 'INGRESO' | 'CREACION' | 'EDICION' | 'ELIMINACION' | 'ETIQUETA';

export default function ActividadPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros
  const [filterTipo, setFilterTipo] = useState<ActionType>('TODOS');
  const [filterUsuario, setFilterUsuario] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [usuarios, setUsuarios] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    fetchActividad();

    const channel = supabase
      .channel('actividad_page_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transacciones' },
        async (payload) => {
          // Buscamos los datos relacionados para la nueva fila
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

          // Agregamos el movimiento al principio de la lista sin recargar todo
          setMovimientos(prev => [txCompleta, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset de página al buscar o filtrar
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

      // Obtener usuarios únicos para el dropdown de filtros
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

  // Filtrado
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

  // Helper para los botones de filtro estilo "UsuariosPage"
  const tipos = ['TODOS', 'INGRESO', 'SALIDA', 'CREACION', 'EDICION', 'ELIMINACION', 'ETIQUETA'] as const;
  
  const tipoChipClass = (tipo: ActionType, active: boolean) => {
    if (!active) return 'bg-white text-slate-600 border-slate-200 hover:border-slate-300';
    switch (tipo) {
      case 'INGRESO': return 'bg-emerald-600 text-white border-emerald-600';
      case 'SALIDA': return 'bg-amber-500 text-white border-amber-500';
      case 'CREACION': return 'bg-blue-600 text-white border-blue-600';
      case 'ELIMINACION': return 'bg-red-600 text-white border-red-600';
      case 'EDICION': return 'bg-purple-600 text-white border-purple-600';
      case 'ETIQUETA': return 'bg-pink-600 text-white border-pink-600';
      default: return 'bg-slate-900 text-white border-slate-900'; // TODOS
    }
  };

  // Helper para iconos y colores en la lista
  const getActionStyles = (tipo: string) => {
    switch (tipo) {
      case 'SALIDA': return { icon: <ArrowUpRight className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Retiro de equipo' };
      case 'INGRESO': return { icon: <ArrowDownLeft className="h-5 w-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Ingreso de equipo' };
      case 'CREACION': return { icon: <PlusCircle className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Hardware Registrado' };
      case 'ELIMINACION': return { icon: <Trash2 className="h-5 w-5" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: 'Hardware Eliminado' };
      case 'EDICION': return { icon: <Edit3 className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', label: 'Hardware Editado' };
      case 'ETIQUETA': return { icon: <Tag className="h-5 w-5" />, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', label: 'Cambio de Etiqueta' };
      default: return { icon: <FileText className="h-5 w-5" />, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', label: 'Actividad General' };
    }
  };

  return (
    <div className="space-y-6 relative w-full">
      {/* Header unificado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de Actividad</h1>
        <p className="text-sm text-slate-500">Registro detallado en tiempo real de movimientos, cambios y gestiones de hardware.</p>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Buscador */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar equipo, correo, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            />
          </div>

          {/* Contador y Dropdown de Usuarios */}
          <div className="flex items-center gap-2 flex-wrap sm:ml-auto w-full sm:w-auto">
            <select
              value={filterUsuario}
              onChange={e => setFilterUsuario(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer flex-1 sm:flex-none truncate max-w-50"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>

            {!loading && (
              <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-2 rounded-xl whitespace-nowrap">
                {filteredMovimientos.length} movs.
              </span>
            )}
          </div>
        </div>

        {/* Filtro por tipo de movimiento (Flex-wrap para móviles) */}
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

      {/* Lista de movimientos */}
      <div className="space-y-4 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="font-medium">Cargando la matrix de eventos...</p>
          </div>
        ) : paginatedMovimientos.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron movimientos.</p>
          </div>
        ) : (
          paginatedMovimientos.map((mov) => {
            const styles = getActionStyles(mov.tipo);
            return (
              <div
                key={mov.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300 group w-full"
              >
                <div className="flex items-start gap-4 w-full min-w-0">
                  {/* Ícono */}
                  <div className={`mt-0.5 rounded-2xl p-3 shadow-inner border shrink-0 ${styles.bg} ${styles.color} ${styles.border}`}>
                    {styles.icon}
                  </div>

                  {/* Contenido Principal */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 min-w-0 mb-1">
                      <span className="font-bold text-slate-900 text-base leading-tight truncate">
                        {styles.label}
                      </span>
                      {mov.sku && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate max-w-30 sm:max-w-none">
                          SKU: {mov.sku}
                        </span>
                      )}
                    </div>

                    {mov.notas && (
                      <p className="text-sm text-slate-600 mb-3 italic leading-relaxed wrap-break-word line-clamp-2">
                        "{mov.notas}"
                      </p>
                    )}

                    {/* Metadatos (Usuario y Equipo) estilo "Stats" de UsuariosPage */}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 max-w-full">
                        <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">{mov.hardware?.modelo || 'Hardware desconocido'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100 max-w-full">
                        <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="font-bold text-blue-800 truncate">{mov.perfiles?.email || 'Operador desconocido'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fecha y Etiqueta lateral (Alineada a la derecha en Desktop) */}
                <div className="sm:text-right shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-50 pt-4 sm:pt-0 mt-2 sm:mt-0 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-semibold capitalize whitespace-nowrap">
                      {mov.timestamp ? format(new Date(mov.timestamp), "d MMM, HH:mm", { locale: es }) : '-'}
                    </span>
                  </div>
                  <span className={`hidden sm:inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border ${tipoChipClass(mov.tipo as ActionType, true)}`}>
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
        <div className="flex items-center justify-between pt-4 pb-2">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> al <span className="font-bold text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMovimientos.length)}</span>
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-600 px-1">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Footer / Hint decorativo como en UsuariosPage */}
      <div className="flex items-start gap-3 rounded-3xl bg-slate-50 border border-slate-100 p-5 mt-8">
        <Activity className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-slate-700">Registro inmutable</h4>
          <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
            Todas las acciones quedan registradas en tiempo real. Este historial no puede ser editado ni eliminado manualmente por seguridad de la bodega.
          </p>
        </div>
      </div>
    </div>
  );
}