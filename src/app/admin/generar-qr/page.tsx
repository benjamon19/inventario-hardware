'use client';

import { Fragment, useRef } from 'react';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Transition } from '@headlessui/react';

import {
  Search, Printer, Package, QrCode, Laptop, Monitor, Cpu,
  HardDrive, Tablet, Keyboard, Loader2, ChevronLeft, ChevronRight,
  CheckSquare, Square, X, Layers, MapPin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Estado    = { id: string; nombre: string; color: string };
type Categoria = { id: string; nombre: string; prefijo: string };
type Ubicacion = { id: string; nombre: string };

const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue:    'bg-blue-50 text-blue-700 border-blue-100',
  amber:   'bg-amber-50 text-amber-700 border-amber-100',
  red:     'bg-red-50 text-red-700 border-red-100',
  violet:  'bg-violet-50 text-violet-700 border-violet-100',
  slate:   'bg-slate-50 text-slate-700 border-slate-100',
};

const colorDotClasses: Record<string, string> = {
  emerald: 'bg-emerald-500',
  blue:    'bg-blue-500',
  amber:   'bg-amber-500',
  red:     'bg-red-500',
  violet:  'bg-violet-500',
  slate:   'bg-slate-400',
};

const getIconoCategoria = (nombre: string) => {
  const n = (nombre ?? '').toLowerCase();
  if (n.includes('laptop') || n.includes('notebook'))                                              return <Laptop    className="h-5 w-5" />;
  if (n.includes('monitor') || n.includes('pantalla'))                                             return <Monitor   className="h-5 w-5" />;
  if (n.includes('tablet'))                                                                        return <Tablet    className="h-5 w-5" />;
  if (n.includes('periferico') || n.includes('periférico') || n.includes('teclado') || n.includes('mouse')) return <Keyboard  className="h-5 w-5" />;
  if (n.includes('componente') || n.includes('cpu') || n.includes('ram'))                                   return <Cpu       className="h-5 w-5" />;
  if (n.includes('pc') || n.includes('escritorio'))                                                return <HardDrive className="h-5 w-5" />;
  return <Package className="h-5 w-5" />;
};

export default function GenerarQRPage() {
  const [sku,         setSku]         = useState('');
  const [item,        setItem]        = useState<any>(null);
  const [disponibles, setDisponibles] = useState<any[]>([]);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const [estados,     setEstados]     = useState<Estado[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading,     setLoading]     = useState(true);

  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterEstado,    setFilterEstado]    = useState('');
  const [filterUbicacion, setFilterUbicacion] = useState('');
  
  const [currentPage,     setCurrentPage]     = useState(1);
  const [itemsPerPage,    setItemsPerPage]    = useState(12);
  const topRef = useRef<HTMLDivElement>(null);

  const [multiMode,   setMultiMode]   = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Listas ordenadas alfabéticamente
  const sortedCategorias  = [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const sortedEstados     = [...estados].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const sortedUbicaciones = [...ubicaciones].sort((a, b) => a.nombre.localeCompare(b.nombre));

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: hw }, { data: cats }, { data: ests }, { data: ubics }] = await Promise.all([
        supabase.from('hardware').select('*').order('updated_at', { ascending: false }),
        supabase.from('categorias').select('*').order('nombre'),
        supabase.from('estados').select('*').order('nombre'),
        supabase.from('ubicacion').select('*').order('nombre'),
      ]);
      if (hw)    setDisponibles(hw);
      if (cats)  setCategorias(cats);
      if (ests)  setEstados(ests);
      if (ubics) setUbicaciones(ubics);
      setLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params   = new URLSearchParams(window.location.search);
    const skuParam = params.get('sku');
    if (skuParam) {
      setSku(skuParam);
      supabase.from('hardware').select('*').eq('sku', skuParam.trim()).single()
        .then(({ data }) => { if (data) setItem(data); });
    }
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategoria, filterEstado, filterUbicacion]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1350) {
        setItemsPerPage(12);
      } else {
        setItemsPerPage(6);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const buscarEquipo = async () => {
    const { data } = await supabase.from('hardware').select('*').eq('sku', sku.trim()).single();
    setItem(data ?? null);
  };

  const seleccionarEquipo = (equipo: any) => {
    if (multiMode) { toggleSeleccion(equipo.id); return; }
    setItem(equipo);
    setSku(equipo.sku);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSeleccion = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleMultiMode = () => {
    setMultiMode(v => !v);
    setSelectedIds(new Set());
  };

  const seleccionarTodosPagina = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      paginatedItems.forEach(eq => next.add(eq.id));
      return next;
    });
  };

  const deseleccionarTodos = () => setSelectedIds(new Set());
  const imprimir = () => window.print();

  const filteredItems = disponibles.filter(eq => {
    const matchSearch =
      eq.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat  = !filterCategoria  || eq.categoria === filterCategoria;
    const matchEst  = !filterEstado     || eq.estado    === filterEstado;
    const matchUbic = !filterUbicacion  || eq.ubicacion === filterUbicacion;
    return matchSearch && matchCat && matchEst && matchUbic;
  });

  const totalPages     = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const itemsParaImprimir = disponibles.filter(eq => selectedIds.has(eq.id));

  const getBadgeClass = (estadoNombre: string) => {
    const est = estados.find(e => e.nombre === estadoNombre);
    return colorClasses[est?.color ?? 'slate'] ?? colorClasses.slate;
  };

  const handlePageChange = (newPage: number, isTop: boolean) => {
    setCurrentPage(newPage);
    if (!isTop) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderPaginacion = (posicion: 'top' | 'bottom') => {
    if (loading || filteredItems.length <= itemsPerPage) return null;
    
    const isTop = posicion === 'top';
    
    return (
      <div className={`border border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl shadow-sm my-4 ${isTop ? 'justify-between' : 'justify-center'}`}>
        <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
          Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> de <span className="font-bold text-slate-700">{filteredItems.length}</span> registros
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => handlePageChange(Math.max(1, currentPage - 1), isTop)} disabled={currentPage === 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
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
                <button key={p} onClick={() => handlePageChange(p as number, isTop)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                  {p}
                </button>
              )
            )}
          <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1), isTop)} disabled={currentPage === totalPages} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const listaImpresion = multiMode ? itemsParaImprimir : (item ? [item] : []);

  return (
    <>
      <style>{`
        @media screen {
          .print-only { display: none !important; }
        }

        @media print {
          .screen-only { display: none !important; }

          @page {
            size: auto;
            margin: 0;
          }

          body, html {
            margin: 0;
            padding: 0;
            background: white !important;
          }

          .print-only {
            display: block !important;
          }

          .etiqueta {
            height: 100vh;
            width: 100;
            display: flex !important;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 5%;
            box-sizing: border-box;
            background: white;
            font-family: system-ui, sans-serif;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .etiqueta:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      {/* ETIQUETAS PARA IMPRIMIR */}
      {listaImpresion.length > 0 && (
        <div className="print-only">
          {listaImpresion.map((eq) => (
            <div key={eq.id} className="etiqueta">
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 0 }}>
                <QRCodeSVG value={eq.sku} level="H" includeMargin={false} style={{ width: '100%', height: '100%' }} />
              </div>
              <div style={{ flexShrink: 0, textAlign: 'center', width: '100%', marginTop: '2mm' }}>
                <p style={{ color: 'black', fontSize: 'clamp(14px, 5vw, 48px)', fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: '0.05em' }}>{eq.sku}</p>
                <p style={{ fontSize: 'clamp(10px, 3vw, 28px)', fontWeight: 700, color: '#444', margin: '2px 0 0 0', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq.modelo}</p>
                <p style={{ fontSize: 'clamp(8px, 2vw, 20px)', color: '#555', margin: '2px 0 0 0', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq.categoria}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UI PANTALLA */}
      <div className="screen-only max-w-5xl mx-auto space-y-8">

        {/* Buscador */}
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
            <button onClick={buscarEquipo} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer text-sm">
              Buscar
            </button>
          </div>
        </div>

        {/* Vista previa — modo individual */}
        {!multiMode && item && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vista previa</p>
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
                <h3 className="font-bold text-blue-900 flex items-center gap-2"><Package className="h-4 w-4" /> Datos del equipo</h3>
                <ul className="mt-4 space-y-2 text-sm text-blue-800">
                  <li><strong>Categoría:</strong> {item.categoria}</li>
                  <li><strong>Modelo:</strong> {item.modelo}</li>
                  <li><strong>Estado:</strong> {item.estado}</li>
                  {item.ubicacion && <li><strong>Estante:</strong> {item.ubicacion}</li>}
                  {item.descripcion && <li><strong>Notas:</strong> <span className="font-normal">{item.descripcion}</span></li>}
                </ul>
              </div>
              <button onClick={imprimir} className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all cursor-pointer">
                <Printer className="h-5 w-5" /> Imprimir Etiqueta
              </button>
              <button onClick={() => setItem(null)} className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all cursor-pointer text-sm">
                Seleccionar otro equipo
              </button>
            </div>
          </div>
        )}

        {/* Listado */}
        <div ref={topRef} className="space-y-4">

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-700">Todos los equipos</h2>
              {!loading && (
                <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1 rounded-full">
                  {filteredItems.length}{filteredItems.length !== disponibles.length ? ` de ${disponibles.length}` : ''} registrados
                </span>
              )}
            </div>
            <button
              onClick={toggleMultiMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                multiMode
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              <Layers className="h-4 w-4" />
              {multiMode ? 'Cancelar selección' : 'Selección múltiple'}
            </button>
          </div>

          {multiMode && (
            <div className="flex items-center gap-3 flex-wrap bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
              <span className="text-sm font-bold text-violet-800">
                {selectedIds.size === 0
                  ? 'Haz clic en los equipos que quieres etiquetar'
                  : `${selectedIds.size} equipo${selectedIds.size > 1 ? 's' : ''} seleccionado${selectedIds.size > 1 ? 's' : ''}`}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={seleccionarTodosPagina} className="text-xs font-bold text-violet-600 hover:text-violet-800 underline cursor-pointer">
                  Seleccionar página
                </button>
                {selectedIds.size > 0 && (
                  <button onClick={deseleccionarTodos} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer">
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Búsqueda */}
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
          {!loading && sortedCategorias.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategoria('')}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${!filterCategoria ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                Todas
              </button>
              {sortedCategorias.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategoria(filterCategoria === cat.nombre ? '' : cat.nombre)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${filterCategoria === cat.nombre ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600'}`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          )}

          {/* Filtros estado */}
          {!loading && sortedEstados.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Estado:</span>
              {sortedEstados.map(est => {
                const dot    = colorDotClasses[est.color] ?? 'bg-slate-400';
                const badge  = colorClasses[est.color]    ?? colorClasses.slate;
                const active = filterEstado === est.nombre;
                return (
                  <button
                    key={est.id}
                    onClick={() => setFilterEstado(active ? '' : est.nombre)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${active ? `${badge} ring-2 ring-offset-1 ring-current` : `${badge} opacity-60 hover:opacity-100`}`}
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

          {/* Filtro por estante/ubicación */}
          {!loading && sortedUbicaciones.length > 0 && (
            <div className="flex items-center gap-3 w-full">
              {/* Label fijo */}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
                <MapPin className="h-3 w-3" /> Estante:
              </span>

              {/* Contenedor con Scroll */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 grow">
                {sortedUbicaciones.map(ubic => {
                  const active = filterUbicacion === ubic.nombre;
                  return (
                    <button
                      key={ubic.id}
                      onClick={() => setFilterUbicacion(active ? '' : ubic.nombre)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-teal-200 hover:text-teal-600'
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                      {ubic.nombre}
                    </button>
                  );
                })}
              </div>

              {/* Botón de limpiar */}
              {filterUbicacion && (
                <button 
                  onClick={() => setFilterUbicacion('')} 
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer shrink-0 ml-2"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}

          {/* Paginación ARRIBA */}
          {renderPaginacion('top')}

          {/* Grid */}
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
                const isSelected = multiMode ? selectedIds.has(equipo.id) : item?.id === equipo.id;
                return (
                  <button
                    key={equipo.id}
                    onClick={() => seleccionarEquipo(equipo)}
                    className={`group w-full text-left rounded-2xl border p-4 transition-all cursor-pointer flex items-center gap-4 ${
                      multiMode
                        ? isSelected ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40'
                        : isSelected ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'       : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                    }`}
                  >
                    {multiMode ? (
                      <div className={`shrink-0 rounded-xl p-2.5 transition-colors ${isSelected ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400 group-hover:bg-violet-100 group-hover:text-violet-500'}`}>
                        {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                      </div>
                    ) : (
                      <div className={`shrink-0 rounded-xl p-2.5 transition-colors ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                        {getIconoCategoria(equipo.categoria)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{equipo.modelo}</p>
                      <p className="font-mono text-[11px] text-slate-400 truncate">{equipo.sku}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold border ${getBadgeClass(equipo.estado)}`}>
                          {equipo.estado}
                        </span>
                        {equipo.ubicacion && (
                          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" /> {equipo.ubicacion}
                          </span>
                        )}
                      </div>
                    </div>
                    <QrCode className={`h-4 w-4 shrink-0 transition-colors ${
                      multiMode
                        ? isSelected ? 'text-violet-400' : 'text-slate-200 group-hover:text-violet-300'
                        : isSelected ? 'text-blue-500'   : 'text-slate-200 group-hover:text-blue-300'
                    }`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Paginación ABAJO */}
          {renderPaginacion('bottom')}

        </div>

        {multiMode && selectedIds.size > 0 && <div className="h-24" />}
      </div>

      {/* BARRA STICKY BATCH */}
      <Transition
        show={multiMode && selectedIds.size > 0}
        as={Fragment}
        enter="transition ease-out duration-300 transform"
        enterFrom="opacity-0 translate-y-10 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-200 transform"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-10 scale-95"
      >
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 flex justify-center pointer-events-none print:hidden">
          <div className="pointer-events-auto w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 sm:gap-5 bg-white px-5 py-3 sm:pl-7 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {selectedIds.size} seleccionada{selectedIds.size > 1 ? 's' : ''}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 leading-tight">
                {selectedIds.size} etiqueta{selectedIds.size > 1 ? 's' : ''} lista para imprimir
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 shrink-0" />
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={imprimir} 
                className="flex items-center gap-2 bg-violet-600 text-white px-4 sm:px-6 py-2.5 rounded-full font-bold hover:bg-violet-700 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer text-sm whitespace-nowrap"
              >
                <Printer className="h-4 w-4" /> 
                <span className="hidden sm:inline">Imprimir todas</span>
                <span className="sm:hidden">Imprimir</span>
              </button>
              <button 
                onClick={deseleccionarTodos} 
                title="Limpiar selección" 
                className="p-2 sm:p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </>
  );
}