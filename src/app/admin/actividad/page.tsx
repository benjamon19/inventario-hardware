'use client';

import { useState, useEffect } from 'react';
import { 
  Search, ArrowUpRight, ArrowDownLeft, 
  User, Calendar, Package, Loader2, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ITEMS_PER_PAGE = 15;

export default function ActividadPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros
  const [filterTipo, setFilterTipo] = useState<'TODOS' | 'SALIDA' | 'INGRESO'>('TODOS');
  const [filterUsuario, setFilterUsuario] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Lista de usuarios únicos para el dropdown
  const [usuarios, setUsuarios] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    fetchActividad();
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
      mov.sku?.toLowerCase().includes(searchTerm.toLowerCase());
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

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial de Actividad</h1>
        <p className="text-sm text-slate-500">Registro detallado de retiros y devoluciones de hardware.</p>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por equipo, correo o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
        />
      </div>

      {/* Filtros */}
      {!loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">

          {/* Tipo */}
          <div className="flex items-center gap-2">
            {(['TODOS', 'SALIDA', 'INGRESO'] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setFilterTipo(tipo)}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${
                  filterTipo === tipo
                    ? tipo === 'SALIDA'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : tipo === 'INGRESO'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-900 text-white border-slate-900'
                    : tipo === 'SALIDA'
                      ? 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                      : tipo === 'INGRESO'
                        ? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tipo === 'TODOS' ? 'Todos' : tipo === 'SALIDA' ? '↑ Retiros' : '↓ Devoluciones'}
              </button>
            ))}
          </div>

          {/* Separador visual en desktop */}
          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Filtro por usuario */}
          <div className="flex items-center gap-2">
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
              <button
                onClick={() => setFilterUsuario('')}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Contador */}
          <span className="ml-auto text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded-full">
            {filteredMovimientos.length}
            {filteredMovimientos.length !== movimientos.length && ` de ${movimientos.length}`} movimiento{filteredMovimientos.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="font-medium">Sincronizando movimientos...</p>
          </div>
        ) : paginatedMovimientos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Clock className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron movimientos.</p>
          </div>
        ) : (
          paginatedMovimientos.map((mov) => (
            <div
              key={mov.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 shadow-sm shrink-0 ${
                  mov.tipo === 'SALIDA'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {mov.tipo === 'SALIDA' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {mov.tipo === 'SALIDA' ? 'Retiro de equipo' : 'Ingreso de equipo'}
                    </span>
                    <span className="text-xs font-bold text-slate-300">•</span>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {mov.sku}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{mov.hardware?.modelo || 'Hardware desconocido'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>{mov.perfiles?.email || 'Operador desconocido'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="capitalize">
                        {mov.timestamp
                          ? format(new Date(mov.timestamp), "d 'de' MMMM, HH:mm", { locale: es })
                          : 'Fecha no disponible'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end shrink-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                  mov.tipo === 'SALIDA'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {mov.tipo}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {!loading && filteredMovimientos.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando{' '}
            <span className="font-bold text-slate-700">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMovimientos.length)}
            </span>{' '}
            de <span className="font-bold text-slate-700">{filteredMovimientos.length}</span> movimientos
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
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
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-2rem h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}