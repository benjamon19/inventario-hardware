'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera, Search, X, ArrowUpRight, ArrowDownLeft,
  AlertCircle, CheckCircle2, History, ChevronLeft, ChevronRight,
  ArrowLeftRight, MapPin, Layers
} from 'lucide-react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Scanner } from '@yudiel/react-qr-scanner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pagination } from '@/components/ui/Pagination';


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

  const getPaginationEl = (posicion: 'top' | 'bottom') => {
    if (loadingActivity || totalItems <= itemsPerPage) return null;
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

  return (
    <div className="mx-auto max-w-lg space-y-3 pt-2 sm:pt-4 pb-16">

      {/* TABS DE MODO */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl mb-4">
        <button
          id="tour-mover-stock"
          onClick={() => { setScanMode('TRANSACTION'); setSelectedItem(null); setIsScanning(true); }}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${scanMode === 'TRANSACTION' ? 'bg-slate-50 text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <ArrowLeftRight className="h-4 w-4" /> Mover Stock
        </button>
        <button
          id="tour-buscar-detalles"
          onClick={() => { setScanMode('SEARCH'); setSelectedItem(null); setIsScanning(true); }}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${scanMode === 'SEARCH' ? 'bg-slate-50 text-violet-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Search className="h-4 w-4" /> Buscar Detalles
        </button>
      </div>

      <div id="tour-scanner-view" className="overflow-hidden rounded-2xl bg-slate-50 shadow-md shadow-slate-200/50 border border-slate-100">
        {isScanning ? (
          <div className="relative h-44 bg-slate-100 w-full overflow-hidden border-b border-slate-200">
            <Scanner
              onScan={(result) => {
                if (result && result.length > 0) {
                  processSku(result[0].rawValue);
                }
              }}
              components={{ finder: false }}
              sound={false}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className={`h-28 w-28 border-2 border-dashed rounded-2xl animate-pulse flex items-center justify-center bg-white/40 backdrop-blur-[1px] ${scanMode === 'SEARCH' ? 'border-violet-600' : 'border-slate-900'
                }`}>
                {scanMode === 'SEARCH'
                  ? <Search className="h-8 w-8 text-violet-600 drop-shadow-sm" />
                  : <Camera className="h-8 w-8 text-slate-900 drop-shadow-sm" />
                }
              </div>
              <p className="mt-3 text-[11px] font-bold bg-white/90 border border-slate-200 px-3.5 py-1.5 rounded-full text-slate-900 shadow-sm backdrop-blur-md">
                {scanMode === 'SEARCH' ? 'Enfoca para buscar detalles' : 'Enfoca para mover stock'}
              </p>
            </div>
          </div>
        ) : selectedItem && (
          <div className="p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${selectedItem.estado === 'DISPONIBLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-900 border-slate-200'
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
                  <Camera className="h-5 w-5" />
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
              placeholder={scanMode === 'SEARCH' ? "Ingresa SKU para buscar..." : "O búsqueda manual..."}
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value.trim().toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && processSku(manualSku)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-slate-900 transition-all shadow-sm font-mono uppercase"
            />
            {loading && <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center"><TailChase size="14" speed="1.75" color="#cbd5e1" /></div>}
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

          {getPaginationEl('top')}

          <div className="space-y-2">
            {loadingActivity ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <TailChase size="30" speed="1.75" color="#cbd5e1" />
              </div>
            ) : recentActivity.map((mov) => (
              <div key={mov.id} className="flex items-start justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100 shadow-sm gap-2 hover:border-slate-200 transition-colors">
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
              <div className="text-center py-4 text-xs text-slate-500 font-semibold italic">No hay movimientos registrados</div>
            )}
          </div>

          {getPaginationEl('bottom')}
        </div>
      )}
    </div>
  );
}