'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScanLine, Search, X, Loader2, ArrowUpRight, ArrowDownLeft,
  AlertCircle, CheckCircle2, History, ChevronLeft, ChevronRight,
  ArrowLeftRight, MapPin, Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Scanner } from '@yudiel/react-qr-scanner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getInitialItemsPerPage = () => {
  if (typeof window === 'undefined') return 12;
  return window.innerWidth >= 1350 ? 12 : 6;
};

export default function AdminScannerPage() {
  const router = useRouter();

  const [scanMode, setScanMode] = useState<'TRANSACTION' | 'SEARCH'>('TRANSACTION');
  const [manualSku, setManualSku] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getInitialItemsPerPage);
  const [totalItems, setTotalItems] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth >= 1350 ? 12 : 6);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchActivity = useCallback(async (page: number, limit: number) => {
    setLoadingActivity(true);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, count } = await supabase
      .from('transacciones')
      .select(`id, tipo, timestamp, sku, hardware (modelo)`, { count: 'estimated' })
      .order('timestamp', { ascending: false })
      .range(start, end);

    if (data) {
      setRecentActivity(data);
      setTotalItems(count ?? 0);
    }
    setLoadingActivity(false);
  }, []);

  useEffect(() => {
    fetchActivity(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, fetchActivity]);

  // ── Realtime: nueva transacción registrada ──
  useRealtimeTable({
    table: 'transacciones',
    events: ['INSERT'],
    debounceMs: 1000,
    onRefresh: useCallback(() => {
      setCurrentPage(1);
      fetchActivity(1, itemsPerPage);
    }, [fetchActivity, itemsPerPage]),
  });

  // ── Realtime: cambio de estado en hardware ──
  useRealtimeTable({
    table: 'hardware',
    events: ['UPDATE'],
    debounceMs: 500,
    onRefresh: useCallback(() => {
      // Si hay un item seleccionado, refresca su estado
      if (selectedItem?.sku) {
        supabase
          .from('hardware')
          .select('*')
          .eq('sku', selectedItem.sku)
          .single()
          .then(({ data }) => {
            if (data) setSelectedItem(data);
          });
      }
    }, [selectedItem]),
  });

  useEffect(() => {
    if (isScanning && !selectedItem) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isScanning, selectedItem]);

  useEffect(() => {
    const skuValido = /^[A-Z0-9]{2,5}-\d{4}$/i.test(manualSku.trim());
    if (skuValido) {
      const timer = setTimeout(() => processSku(manualSku.trim().toUpperCase()), 150);
      return () => clearTimeout(timer);
    }
  }, [manualSku]);

  const processSku = async (sku: string) => {
    if (!sku) return;
    inputRef.current?.blur();
    setLoading(true);
    setStatusMsg(null);

    const { data: item, error } = await supabase
      .from('hardware')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error || !item) {
      setStatusMsg({ type: 'error', text: 'Equipo no encontrado en inventario.' });
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
      setIsScanning(false);
    }

    setManualSku('');
    setLoading(false);
  };

  const registrarMovimiento = async (tipo: 'INGRESO' | 'SALIDA') => {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user || !selectedItem) {
      setStatusMsg({ type: 'error', text: 'Error de sesión o selección.' });
      setLoading(false);
      return;
    }

    const { error: transError } = await supabase
      .from('transacciones')
      .insert([{
        sku: selectedItem.sku,
        hardware_id: selectedItem.id,
        operador_id: user.id,
        tipo: tipo,
        timestamp: new Date().toISOString()
      }]);

    const nuevoEstado = tipo === 'SALIDA' ? 'EN_USO' : 'DISPONIBLE';
    const { error: hwError } = await supabase
      .from('hardware')
      .update({ estado: nuevoEstado })
      .eq('sku', selectedItem.sku);

    if (!transError && !hwError) {
      await supabase.from('auditoria_logs').insert([{
        accion: tipo,
        entidad: 'HARDWARE',
        usuario_id: user.id,
        detalles: {
          sku: selectedItem.sku,
          modelo: selectedItem.modelo,
          notas: `Cambio de estado desde Escáner. Nuevo estado: ${nuevoEstado}`
        }
      }]);

      setStatusMsg({ type: 'success', text: `${tipo} registrado con éxito.` });
      setSelectedItem(null);
      setIsScanning(true);
      setManualSku('');
      // El realtime de transacciones ya actualiza la lista automáticamente
    } else {
      setStatusMsg({ type: 'error', text: 'Error al registrar el movimiento.' });
    }

    setLoading(false);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const handlePageChange = (newPage: number) => setCurrentPage(newPage);

  const renderPaginacion = (posicion: 'top' | 'bottom') => {
    if (loadingActivity || totalItems <= itemsPerPage) return null;
    const isTop = posicion === 'top';

    return (
      <div className={`border border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl shadow-sm my-4 ${isTop ? 'justify-between' : 'justify-center'}`}>
        <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
          Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-bold text-slate-700">{totalItems}</span> registros
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

  return (
    <div className="mx-auto max-w-lg space-y-3 pt-2 sm:pt-4 pb-16">

      {/* Header con indicador realtime */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">En vivo</span>
        </div>
      </div>

      {/* TABS DE MODO */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl mb-4">
        <button
          onClick={() => { setScanMode('TRANSACTION'); setSelectedItem(null); setIsScanning(true); }}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${scanMode === 'TRANSACTION' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <ArrowLeftRight className="h-4 w-4" /> Mover Stock
        </button>
        <button
          onClick={() => { setScanMode('SEARCH'); setSelectedItem(null); setIsScanning(true); }}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${scanMode === 'SEARCH' ? 'bg-white text-violet-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Search className="h-4 w-4" /> Buscar Detalles
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-md shadow-slate-200/50 border border-slate-100">
        {isScanning ? (
          <div className="relative h-44 bg-slate-900 w-full">
            <Scanner
              onScan={(result) => {
                if (result && result.length > 0) {
                  processSku(result[0].rawValue);
                }
              }}
              components={{ finder: false }}
              sound={false}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 pointer-events-none">
              <div className={`h-28 w-28 border-2 border-dashed rounded-2xl animate-pulse flex items-center justify-center bg-black/10 ${scanMode === 'SEARCH' ? 'border-violet-500' : 'border-blue-500'
                }`}>
                {scanMode === 'SEARCH'
                  ? <Search className="h-8 w-8 text-violet-500 drop-shadow-md" />
                  : <ScanLine className="h-8 w-8 text-blue-500 drop-shadow-md" />
                }
              </div>
              <p className="mt-2 text-[11px] font-medium bg-black/60 px-3 py-1 rounded-full text-white shadow-sm">
                {scanMode === 'SEARCH' ? 'Enfoca para buscar detalles' : 'Enfoca para mover stock'}
              </p>
            </div>
          </div>
        ) : selectedItem && (
          <div className="p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${selectedItem.estado === 'DISPONIBLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                {selectedItem.estado}
              </span>
              <button onClick={() => { setIsScanning(true); setSelectedItem(null); setManualSku(''); }} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-tight">{selectedItem.modelo}</h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">SKU: {selectedItem.sku}</p>

            {scanMode === 'SEARCH' && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold">{selectedItem.categoria}</span>
                </div>
                {selectedItem.ubicacion && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold">{selectedItem.ubicacion}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {scanMode === 'TRANSACTION' ? (
                <>
                  <button
                    onClick={() => registrarMovimiento('SALIDA')}
                    disabled={loading || selectedItem.estado === 'EN_USO'}
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-amber-50 p-2.5 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Retirar</span>
                  </button>
                  <button
                    onClick={() => registrarMovimiento('INGRESO')}
                    disabled={loading || selectedItem.estado === 'DISPONIBLE'}
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-emerald-50 p-2.5 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <ArrowDownLeft className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Devolver</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setIsScanning(true); setSelectedItem(null); setManualSku(''); }}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-violet-50 p-3 text-violet-700 border border-violet-100 hover:bg-violet-100 transition-all cursor-pointer shadow-sm"
                >
                  <ScanLine className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Escanear otro equipo</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-slate-50 p-2.5 bg-slate-50/50 relative z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              maxLength={50}
              spellCheck="false"
              autoComplete="off"
              placeholder={scanMode === 'SEARCH' ? "Ingresa SKU para buscar..." : "Pistola o manual..."}
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value.trim().toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && processSku(manualSku)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-500 transition-all shadow-sm font-mono uppercase"
            />
            {loading && <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-blue-500" />}
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className={`flex items-center gap-2 rounded-xl p-3 border animate-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
          }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <p className="text-xs font-semibold">{statusMsg.text}</p>
        </div>
      )}

      {/* ÚLTIMOS MOVIMIENTOS */}
      {scanMode === 'TRANSACTION' && (
        <div className="space-y-2 mt-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <History className="h-3 w-3 text-slate-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Actividad Bodega</h3>
            </div>
          </div>

          {renderPaginacion('top')}

          <div className="space-y-2">
            {loadingActivity ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            ) : recentActivity.map((mov) => (
              <div key={mov.id} className="flex items-start justify-between rounded-xl bg-white p-2.5 border border-slate-100 shadow-sm gap-2 hover:border-blue-100 transition-colors">
                <div className="flex items-start gap-2 flex-1">
                  <div className={`shrink-0 mt-0.5 rounded-md p-1.5 ${mov.tipo === 'SALIDA' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {mov.tipo === 'SALIDA' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{mov.hardware?.modelo}</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">{format(new Date(mov.timestamp), "HH:mm '•' d MMM", { locale: es })}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border mt-0.5">{mov.sku}</span>
              </div>
            ))}

            {!loadingActivity && recentActivity.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400 italic">No hay movimientos registrados</div>
            )}
          </div>

          {renderPaginacion('bottom')}
        </div>
      )}
    </div>
  );
}