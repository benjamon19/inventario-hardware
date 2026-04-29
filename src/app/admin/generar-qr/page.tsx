'use client';

import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { QRCodeSVG } from 'qrcode.react';
import { Transition } from '@headlessui/react';

import {
  Search, Printer, Package, QrCode, Laptop, Monitor, Cpu,
  HardDrive, Tablet, Keyboard, ChevronLeft, ChevronRight,
  CheckSquare, Square, X, Layers, MapPin, MonitorOff,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { registrarLog } from '@/lib/logger';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';

import { Sk, SkeletonFilterRow } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { colorClasses, colorDotClasses } from '@/lib/colorMaps';
import { getIconoCategoria } from '@/lib/categoryIcon';
import MenuImpresion from './MenuImpresion';


const SkeletonQRCard = () => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-4">
    <Sk className="h-10 w-10 rounded-xl shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <Sk className="h-4 w-32" />
      <Sk className="h-3 w-20" />
      <div className="flex gap-2 mt-0.5">
        <Sk className="h-4 w-16 rounded-full" />
        <Sk className="h-4 w-16 rounded" />
      </div>
    </div>
    <Sk className="h-4 w-4 rounded shrink-0" />
  </div>
);

type Estado    = { id: string; nombre: string; color: string };
type Categoria = { id: string; nombre: string; prefijo: string };
type Ubicacion = { id: string; nombre: string };



// --- INICIALIZADOR DE PAGINACIÓN ---
const getInitialItemsPerPage = () => {
  if (typeof window === 'undefined') return 12;
  return window.innerWidth >= 1350 ? 12 : 6;
};

export default function GenerarQRPage() {
  const [sku,         setSku]         = useState('');
  const [item,        setItem]        = useState<any>(null);
  
  // Disponibles ahora guardará solo los equipos de la PÁGINA ACTUAL
  const [disponibles, setDisponibles] = useState<any[]>([]);
  const [totalItems,  setTotalItems]  = useState(0);

  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const [estados,     setEstados]     = useState<Estado[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading,     setLoading]     = useState(true);

  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterEstado,    setFilterEstado]    = useState('');
  const [filterUbicacion, setFilterUbicacion] = useState('');
  
  const [currentPage,     setCurrentPage]     = useState(1);
  const [itemsPerPage,    setItemsPerPage]    = useState(getInitialItemsPerPage);
  const skuInputRef = useRef<HTMLInputElement>(null);

  const [refreshTrigger,  setRefreshTrigger]  = useState(0);

  const [multiMode,   setMultiMode]   = useState(false);
  // Cambiamos el Set por un Map para guardar el objeto completo del equipo seleccionado 
  // y así no perder los datos al cambiar de página
  const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, any>>(new Map());
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const [showMobileToast, setShowMobileToast] = useState(false);

  const triggerPrintMenu = () => {
    if (window.innerWidth < 1024) {
      setShowMobileToast(true);
      setTimeout(() => setShowMobileToast(false), 3000);
    } else {
      setIsPrintMenuOpen(true);
    }
  };

  const [printSettings, setPrintSettings] = useState({

    items: {} as Record<string, { width: number, height: number, fontSize: number, text: string, wrapText: boolean }>
  });






  // Listas ordenadas alfabéticamente
  const sortedCategorias  = useMemo(() => [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre)), [categorias]);
  const sortedEstados     = useMemo(() => [...estados].sort((a, b) => a.nombre.localeCompare(b.nombre)), [estados]);
  const sortedUbicaciones = useMemo(() => [...ubicaciones].sort((a, b) => a.nombre.localeCompare(b.nombre)), [ubicaciones]);

  // Lookup O(1) para badge de estado
  const badgeClassMap = useMemo(() => {
    const map: Record<string, string> = {};
    estados.forEach(e => { map[e.nombre] = colorClasses[e.color] ?? colorClasses.slate; });
    return map;
  }, [estados]);

  useRealtimeTable({
    table: 'hardware',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    debounceMs: 1200,
    onRefresh: useCallback(() => setRefreshTrigger(prev => prev + 1), []),
  });

  // 1. Cargar las categorías y metadata solo una vez al iniciar
  useEffect(() => {
    const fetchMeta = async () => {
      const [{ data: cats }, { data: ests }, { data: ubics }] = await Promise.all([
        supabase.from('categorias').select('*').order('nombre'),
        supabase.from('estados').select('*').order('nombre'),
        supabase.from('ubicacion').select('*').order('nombre'),
      ]);
      if (cats)  setCategorias(cats);
      if (ests)  setEstados(ests);
      if (ubics) setUbicaciones(ubics);
    };
    fetchMeta();
  }, []);

  // 2. Efecto para buscar y paginar en el servidor cada vez que cambien los filtros o la página
  useEffect(() => {
    const fetchHardware = async () => {
      setLoading(true);
      let query = supabase.from('hardware').select('*', { count: 'estimated' });

      // Aplicar filtros en la base de datos
      if (searchTerm) {
        query = query.or(`modelo.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      }
      if (filterCategoria) query = query.eq('categoria', filterCategoria);
      if (filterEstado)    query = query.eq('estado', filterEstado);
      if (filterUbicacion) query = query.eq('ubicacion', filterUbicacion);

      // Calcular inicio y fin para la página actual
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;

      // Traer la porción exacta de la BD
      query = query.order('updated_at', { ascending: false }).range(start, end);

      const { data, count } = await query;
      if (data) setDisponibles(data);
      if (count !== null) setTotalItems(count);
      
      setLoading(false);
    };

    // Usar un pequeño retraso (debounce) para no saturar si escriben rápido en el buscador
    const timer = setTimeout(() => {
      fetchHardware();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage, searchTerm, filterCategoria, filterEstado, filterUbicacion, refreshTrigger]);

  // Cargar settings persistentes
  useEffect(() => {
    const saved = localStorage.getItem('qr_print_settings_v3');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.items) {
          setPrintSettings(parsed);
        }
      } catch (e) {
        console.error('Error loading print settings', e);
      }
    }
  }, []);



  // Manejar parámetro en URL
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

  const toggleMultiMode = useCallback(() => {
    setMultiMode(prev => {
      const nextMode = !prev;
      if (nextMode && item) {
        // Si entramos a modo múltiple y hay un item en preview, lo incluimos automáticamente
        setSelectedItemsMap(new Map([[item.id, item]]));
      } else if (!nextMode) {
        // Al salir del modo múltiple, limpiamos el mapa
        setSelectedItemsMap(new Map());
      }
      return nextMode;
    });
  }, [item]);


  // Ajustar cantidad de items por pantalla y manejar atajos
  useEffect(() => {
    let rafId: ReturnType<typeof requestAnimationFrame>;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setItemsPerPage(window.innerWidth >= 1350 ? 12 : 6);
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleKey = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;

      if (e.key === 'Escape') {
        setIsPrintMenuOpen(false);
        setItem(null);
      }

      if (!isInput) {
        if (e.key === '/') {
          e.preventDefault();
          skuInputRef.current?.focus();
        }
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          toggleMultiMode();
        }
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => { 
      window.removeEventListener('resize', handleResize); 
      window.removeEventListener('keydown', handleKey);
      cancelAnimationFrame(rafId); 
    };
  }, [toggleMultiMode]);



  const getBadgeClass = useCallback((estadoNombre: string) => {
    return badgeClassMap[estadoNombre] ?? colorClasses.slate;
  }, [badgeClassMap]);

  const buscarEquipo = useCallback(async () => {
    if (!sku.trim()) return;
    const { data } = await supabase.from('hardware').select('*').eq('sku', sku.trim()).single();
    setItem(data ?? null);
  }, [sku]);

  const toggleSeleccion = useCallback((equipo: any) => {
    setSelectedItemsMap(prev => {
      const next = new Map(prev);
      next.has(equipo.id) ? next.delete(equipo.id) : next.set(equipo.id, equipo);
      return next;
    });
  }, []);

  const seleccionarEquipo = useCallback((equipo: any) => {
    if (multiMode) { toggleSeleccion(equipo); return; }
    setItem(equipo);
    setSku(equipo.sku);
    // Eliminado scrollTo para evitar mover la vista al seleccionar
  }, [multiMode, toggleSeleccion]);


  const seleccionarTodosPagina = useCallback(() => {
    setSelectedItemsMap(prev => {
      const next = new Map(prev);
      disponibles.forEach(eq => next.set(eq.id, eq));
      return next;
    });
  }, [disponibles]);

  const deseleccionarTodos = useCallback(() => setSelectedItemsMap(new Map()), []);
  
  const imprimir = useCallback(async (settings?: any) => {
    if (settings) setPrintSettings(settings);
    
    const lista = multiMode ? Array.from(selectedItemsMap.values()) : (item ? [item] : []);
    for (const eq of lista) {
      await registrarLog('ETIQUETA', 'HARDWARE', eq.id, { 
        sku: eq.sku, 
        modelo: eq.modelo,
        detalle: 'Impresión de etiqueta QR personalizada' 
      });
    }
    
    setTimeout(() => {
      window.print();
    }, 200);
  }, [multiMode, selectedItemsMap, item]);





  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const getPaginationEl = (posicion: 'top' | 'bottom') => {
    if (loading || totalItems <= itemsPerPage) return null;
    return (
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        showCount={posicion === 'top'}
        justify={posicion === 'top' ? 'between' : 'center'}
      />
    );
  };

  const listaImpresion = multiMode ? Array.from(selectedItemsMap.values()) : (item ? [item] : []);

  const firstItem = listaImpresion[0];
  const firstItemSettings = (firstItem && printSettings?.items && printSettings.items[firstItem.id]) || { 
    width: 5, 
    height: 2.5 
  };

  return (
    <>
      <style>{`
        @media screen {
          .print-only { display: none !important; }
        }

        @media print {
          .screen-only { display: none !important; }

          @page {
            size: ${firstItemSettings.width}cm ${firstItemSettings.height}cm;
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
            display: flex !important;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0;
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
          {listaImpresion.map((eq) => {
            const s = (printSettings?.items && printSettings.items[eq.id]) || { 
              width: 5, 
              height: 2.5, 
              fontSize: 12, 
              wrapText: true,
              text: `${eq.modelo} | ${eq.sku} | ${eq.categoria}` 
            };


            return (
              <div key={eq.id} className="etiqueta" style={{ width: `${s.width}cm`, height: `${s.height}cm` }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', height: '100%', padding: '0.5mm', gap: '2mm' }}>
                  <div style={{ height: '96%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <QRCodeSVG value={eq.sku} size={512} level="H" includeMargin={false} style={{ height: '100%', width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>

                    <p style={{ 
                        color: 'black', 
                        fontSize: `${s.fontSize}px`, 
                        fontWeight: 900, 
                        margin: 0, 
                        lineHeight: 1.1, 
                        whiteSpace: s.wrapText ? 'normal' : 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                    }}>
                        {s.text}
                    </p>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}




      {/* UI PANTALLA */}
      <div className="screen-only max-w-5xl mx-auto space-y-8">

        {/* Buscador */}
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Generador de Etiquetas QR</h1>
          <p className="text-slate-500 text-sm mt-1">Busca un equipo por SKU o selecciónalo desde el listado.</p>
          <div className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={skuInputRef}
                type="text"
                maxLength={50}
                spellCheck="false"
                autoComplete="off"
                placeholder="Ingresa SKU (ej: LAP-1234)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 transition-all text-sm font-semibold uppercase"
                value={sku}
                onChange={(e) => setSku(e.target.value.trim().toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && buscarEquipo()}
              />
            </div>
            <button onClick={buscarEquipo} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all cursor-pointer text-sm">
              Buscar
            </button>
          </div>
        </div>

        {/* Vista previa — modo individual */}
        {!multiMode && item && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vista previa</p>
              <div className="w-48 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm text-center">
                <div className="flex justify-center mb-5">
                  <QRCodeSVG value={item.sku} size={120} level="H" includeMargin={false} />
                </div>
                <p className="text-slate-900 text-base font-black tracking-widest">{item.sku}</p>
                <p className="text-slate-700 text-xs font-bold truncate mt-2">{item.modelo}</p>
                <p className="text-slate-400 text-[10px] truncate mt-1">{item.categoria}</p>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4">
              <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><Package className="h-4 w-4" /> Datos del equipo</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-800">
                  <li><strong>Categoría:</strong> {item.categoria}</li>
                  <li><strong>Modelo:</strong> {item.modelo}</li>
                  <li><strong>Estado:</strong> {item.estado}</li>
                  {item.ubicacion && <li><strong>Estante:</strong> {item.ubicacion}</li>}
                  {item.descripcion && <li><strong>Notas:</strong> <span className="font-normal">{item.descripcion}</span></li>}
                </ul>
              </div>
              <button onClick={triggerPrintMenu} className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all cursor-pointer">
                <Printer className="h-5 w-5" /> Imprimir Etiqueta
              </button>


              <button onClick={() => setItem(null)} className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all cursor-pointer text-sm">
                Seleccionar otro equipo
              </button>
            </div>
          </div>
        )}

        {/* Listado */}
        <div className="space-y-4">

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-700">Todos los equipos</h2>
              {!loading && (
                <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1 rounded-full">
                  {totalItems} encontrados
                </span>
              )}
            </div>
            <button
              onClick={toggleMultiMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                multiMode
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              <Layers className="h-4 w-4" />
              {multiMode ? 'Cancelar selección' : 'Selección múltiple'}
            </button>
          </div>

          {multiMode && (
            <div className="flex items-center gap-3 flex-wrap bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
              <span className="text-sm font-bold text-violet-800">
                {selectedItemsMap.size === 0
                  ? 'Haz clic en los equipos que quieres etiquetar'
                  : `${selectedItemsMap.size} equipo${selectedItemsMap.size > 1 ? 's' : ''} seleccionado${selectedItemsMap.size > 1 ? 's' : ''}`}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={seleccionarTodosPagina} className="text-xs font-bold text-violet-600 hover:text-violet-800 underline cursor-pointer">
                  Seleccionar página actual
                </button>
                {selectedItemsMap.size > 0 && (
                  <button onClick={deseleccionarTodos} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer">
                    Limpiar todo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Búsqueda general por Tabla */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              maxLength={50}
              autoComplete="off"
              placeholder="Filtrar por modelo o SKU..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 transition-all text-sm"
            />
          </div>

          {loading ? (
            <SkeletonFilterRow count={6} height="h-8" />
          ) : sortedCategorias.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => { setFilterCategoria(''); setCurrentPage(1); }} className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${!filterCategoria ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}>Todas</button>
              {sortedCategorias.map(cat => (
                <button key={cat.id} onClick={() => { setFilterCategoria(filterCategoria === cat.nombre ? '' : cat.nombre); setCurrentPage(1); }} className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${filterCategoria === cat.nombre ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'}`}>{cat.nombre}</button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <SkeletonFilterRow count={5} />
          ) : sortedEstados.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Estado:</span>
              {sortedEstados.map(est => {
                const dot    = colorDotClasses[est.color] ?? 'bg-slate-400';
                const badge  = colorClasses[est.color]    ?? colorClasses.slate;
                const active = filterEstado === est.nombre;
                return (
                  <button key={est.id} onClick={() => { setFilterEstado(active ? '' : est.nombre); setCurrentPage(1); }} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${active ? `${badge} ring-2 ring-offset-1 ring-current` : `${badge} opacity-60 hover:opacity-100`}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{est.nombre}
                  </button>
                );
              })}
              {filterEstado && <button onClick={() => { setFilterEstado(''); setCurrentPage(1); }} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer">Limpiar</button>}
            </div>
          ) : null}

          {loading ? (
            <SkeletonFilterRow count={5} />
          ) : sortedUbicaciones.length > 0 ? (
            <div className="flex items-center gap-3 w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0"><MapPin className="h-3 w-3" /> Estante:</span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 grow">
                {sortedUbicaciones.map(ubic => {
                  const active = filterUbicacion === ubic.nombre;
                  return (
                    <button key={ubic.id} onClick={() => { setFilterUbicacion(active ? '' : ubic.nombre); setCurrentPage(1); }} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${active ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-200 hover:text-teal-600'}`}>
                      <MapPin className="h-3 w-3" />{ubic.nombre}
                    </button>
                  );
                })}
              </div>
              {filterUbicacion && <button onClick={() => { setFilterUbicacion(''); setCurrentPage(1); }} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer shrink-0 ml-2">Limpiar</button>}
            </div>
          ) : null}

          {/* Paginación ARRIBA */}
          {getPaginationEl('top')}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array(6).fill(0).map((_, i) => <SkeletonQRCard key={i} />)}
            </div>
          ) : disponibles.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold">No se encontraron equipos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {disponibles.map((equipo) => {
                const isSelected = multiMode ? selectedItemsMap.has(equipo.id) : item?.id === equipo.id;
                return (
                  <button
                    key={equipo.id}
                    onClick={() => seleccionarEquipo(equipo)}
                    className={`group w-full text-left rounded-2xl border p-4 transition-all cursor-pointer flex items-center gap-4 ${
                      multiMode
                        ? isSelected ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200 bg-slate-50 hover:border-violet-200 hover:bg-violet-50/40'
                        : isSelected ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-200'       : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/40'
                    }`}
                  >
                    {multiMode ? (
                      <div className={`shrink-0 rounded-xl p-2.5 transition-colors ${isSelected ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400 group-hover:bg-violet-100 group-hover:text-violet-500'}`}>
                        {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                      </div>
                    ) : (
                      <div className={`shrink-0 rounded-xl p-2.5 transition-colors ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900'}`}>
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
                        : isSelected ? 'text-slate-900'   : 'text-slate-200 group-hover:text-slate-300'
                    }`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Paginación ABAJO */}
          {getPaginationEl('bottom')}

        </div>

        {/* Espaciador constante para evitar saltos al aparecer la barra batch */}
        <div className={`h-24 transition-all duration-300 ${multiMode && selectedItemsMap.size > 0 ? 'block' : 'hidden'}`} />

      </div>

      {/* BARRA STICKY BATCH */}
      <Transition
        show={multiMode && selectedItemsMap.size > 0}
        as={Fragment}
        enter="transition ease-out duration-300 transform"
        enterFrom="opacity-0 translate-y-10 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-200 transform"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-10 scale-95"
      >
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 flex justify-center pointer-events-none print:hidden">
          <div className="pointer-events-auto w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 sm:gap-5 bg-slate-50 px-5 py-3 sm:pl-7 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {selectedItemsMap.size} seleccionada{selectedItemsMap.size > 1 ? 's' : ''}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 leading-tight">
                {selectedItemsMap.size} etiqueta{selectedItemsMap.size > 1 ? 's' : ''} lista para imprimir
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 shrink-0" />
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={triggerPrintMenu} 
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

      <MenuImpresion
        isOpen={isPrintMenuOpen}
        onClose={() => setIsPrintMenuOpen(false)}
        onConfirmPrint={imprimir}
        selectedCount={multiMode ? selectedItemsMap.size : (item ? 1 : 0)}
        selectedItems={multiMode ? Array.from(selectedItemsMap.values()) : (item ? [item] : [])}
      />


      {/* Toast de advertencia Mobile */}
      <Transition show={showMobileToast} as={Fragment} enter="transition ease-out duration-300 transform" enterFrom="opacity-0 translate-y-10 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="transition ease-in duration-200 transform" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-10 scale-95">
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-6 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-white px-6 py-3.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-red-100">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600">
              <MonitorOff className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-slate-800 leading-tight">Impresión no disponible</p>
              <p className="text-[11px] text-red-500 font-medium leading-tight">Por favor, usa una computadora para imprimir etiquetas.</p>
            </div>
          </div>
        </div>
      </Transition>
    </>
  );

}