'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Search, Printer, Package, QrCode, Laptop, Monitor, Cpu, HardDrive, Tablet, Keyboard, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// --- Tipos ---
type Estado = { id: string; nombre: string; color: string };
type Categoria = { id: string; nombre: string; prefijo: string };

// --- Helpers ---
const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100',
};

const colorDotClasses: Record<string, string> = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-400',
};

const getIconoCategoria = (nombre: string) => {
  const n = (nombre ?? '').toLowerCase();
  if (n.includes('laptop') || n.includes('notebook')) return <Laptop className="h-5 w-5" />;
  if (n.includes('monitor') || n.includes('pantalla')) return <Monitor className="h-5 w-5" />;
  if (n.includes('tablet')) return <Tablet className="h-5 w-5" />;
  if (n.includes('periferico') || n.includes('periférico') || n.includes('teclado') || n.includes('mouse')) return <Keyboard className="h-5 w-5" />;
  if (n.includes('componente') || n.includes('cpu') || n.includes('ram')) return <Cpu className="h-5 w-5" />;
  if (n.includes('pc') || n.includes('escritorio')) return <HardDrive className="h-5 w-5" />;
  return <Package className="h-5 w-5" />;
};

const ITEMS_PER_PAGE = 15;

export default function GenerarQRPage() {
  const [sku, setSku] = useState('');
  const [item, setItem] = useState<any>(null);
  const [disponibles, setDisponibles] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: hw }, { data: cats }, { data: ests }] = await Promise.all([
        supabase.from('hardware').select('*').order('updated_at', { ascending: false }),
        supabase.from('categorias').select('*').order('nombre'),
        supabase.from('estados').select('*').order('nombre'),
      ]);
      if (hw) setDisponibles(hw);
      if (cats) setCategorias(cats);
      if (ests) setEstados(ests);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Prellenar SKU si viene por query param
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const skuParam = params.get('sku');
    if (skuParam) {
      setSku(skuParam);
      supabase.from('hardware').select('*').eq('sku', skuParam.trim()).single()
        .then(({ data }) => { if (data) setItem(data); });
    }
  }, []);

  // Reset página al filtrar
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategoria, filterEstado]);

  const buscarEquipo = async () => {
    const { data } = await supabase.from('hardware').select('*').eq('sku', sku.trim()).single();
    setItem(data ?? null);
  };

  const seleccionarEquipo = (equipo: any) => {
    setItem(equipo);
    setSku(equipo.sku);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const imprimir = () => window.print();

  // Filtrado
  const filteredItems = disponibles.filter(eq => {
    const matchSearch =
      eq.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !filterCategoria || eq.categoria === filterCategoria;
    const matchEst = !filterEstado || eq.estado === filterEstado;
    return matchSearch && matchCat && matchEst;
  });

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getBadgeClass = (estadoNombre: string) => {
    const est = estados.find(e => e.nombre === estadoNombre);
    return colorClasses[est?.color ?? 'slate'] ?? colorClasses.slate;
  };

  return (
    <>
      {/* ===== ESTILOS DE IMPRESIÓN ===== */}
      <style>{`
        @media screen {
          .print-only { display: none !important; }
        }
        @media print {
          body * { visibility: hidden; }
          .screen-only, nav, header, footer { display: none !important; }
          .print-only { 
            visibility: visible; 
            position: absolute; 
            left: 0; top: 0; padding: 4px;
          }
          .print-only * { visibility: visible; }
          @page { margin: 0; }
          body { margin: 0; padding: 0; background: white; }
        }
      `}</style>

      {/* ===== ETIQUETA PARA IMPRIMIR ===== */}
      {item && (
        <div className="print-only">
          <div style={{
            width: '160px', background: 'white',
            fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <QRCodeSVG value={item.sku} size={110} level="H" includeMargin={false} />
            </div>
            <p style={{ color: 'black', fontSize: '14px', fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{item.sku}</p>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#000', margin: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.modelo}</p>
            <p style={{ fontSize: '9px', color: '#444', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.categoria}</p>
          </div>
        </div>
      )}

      {/* ===== UI PANTALLA ===== */}
      <div className="screen-only max-w-5xl mx-auto space-y-8">

        {/* Buscador por SKU */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Generador de Etiquetas QR</h1>
          <p className="text-slate-500 text-sm mt-1">Busca un equipo por SKU o selecciónalo desde el listado.</p>
          <div className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ingresa SKU (ej: LAP-1234)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-semibold"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarEquipo()}
              />
            </div>
            <button
              onClick={buscarEquipo}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer text-sm"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Vista QR del equipo seleccionado */}
        {item && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vista previa de etiqueta</p>
              <div className="w-48 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                <div className="flex justify-center mb-5">
                  <QRCodeSVG value={item.sku} size={120} level="H" includeMargin={false} />
                </div>
                <p className="text-slate-900 text-base font-black tracking-widest">{item.sku}</p>
                <p className="text-slate-700 text-xs font-bold truncate mt-2">{item.modelo}</p>
                <p className="text-slate-400 text-[10px] truncate mt-1">{item.categoria}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-900 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Datos del equipo
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-blue-800">
                  <li><strong>Categoría:</strong> {item.categoria}</li>
                  <li><strong>Modelo:</strong> {item.modelo}</li>
                  <li><strong>Estado:</strong> {item.estado}</li>
                  {item.descripcion && (
                    <li><strong>Notas:</strong> <span className="font-normal">{item.descripcion}</span></li>
                  )}
                </ul>
              </div>
              <button
                onClick={imprimir}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Printer className="h-5 w-5" /> Imprimir Etiqueta
              </button>
              <button
                onClick={() => setItem(null)}
                className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all cursor-pointer text-sm"
              >
                Seleccionar otro equipo
              </button>
            </div>
          </div>
        )}

        {/* Listado con filtros */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-bold text-slate-700">Todos los equipos</h2>
            {!loading && (
              <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1 rounded-full">
                {filteredItems.length} {filteredItems.length !== disponibles.length ? `de ${disponibles.length}` : ''} registrados
              </span>
            )}
          </div>

          {/* Búsqueda en listado */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por modelo o SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
            />
          </div>

          {/* Filtros categoría */}
          {!loading && categorias.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategoria('')}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${
                  !filterCategoria
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                Todas
              </button>
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategoria(filterCategoria === cat.nombre ? '' : cat.nombre)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${
                    filterCategoria === cat.nombre
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          )}

          {/* Filtros estado */}
          {!loading && estados.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Estado:</span>
              {estados.map(est => {
                const dot = colorDotClasses[est.color] ?? 'bg-slate-400';
                const badge = colorClasses[est.color] ?? colorClasses.slate;
                const active = filterEstado === est.nombre;
                return (
                  <button
                    key={est.id}
                    onClick={() => setFilterEstado(active ? '' : est.nombre)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
                      active ? `${badge} ring-2 ring-offset-1 ring-current` : `${badge} opacity-60 hover:opacity-100`
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {est.nombre}
                  </button>
                );
              })}
              {filterEstado && (
                <button onClick={() => setFilterEstado('')} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer">
                  Limpiar
                </button>
              )}
            </div>
          )}

          {/* Grid de equipos */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm font-medium">Cargando inventario...</p>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No se encontraron equipos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedItems.map((equipo) => {
                const isSelected = item?.id === equipo.id;
                return (
                  <button
                    key={equipo.id}
                    onClick={() => seleccionarEquipo(equipo)}
                    className={`group w-full text-left rounded-2xl border p-4 transition-all cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                    }`}
                  >
                    <div className={`shrink-0 rounded-xl p-2.5 transition-colors ${
                      isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      {getIconoCategoria(equipo.categoria)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{equipo.modelo}</p>
                      <p className="font-mono text-[11px] text-slate-400 truncate">{equipo.sku}</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${getBadgeClass(equipo.estado)}`}>
                        {equipo.estado}
                      </span>
                    </div>
                    <QrCode className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? 'text-blue-500' : 'text-slate-200 group-hover:text-blue-300'}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {!loading && filteredItems.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500 font-medium">
                Mostrando{' '}
                <span className="font-bold text-slate-700">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
                </span>{' '}
                de <span className="font-bold text-slate-700">{filteredItems.length}</span> equipos
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
      </div>
    </>
  );
}