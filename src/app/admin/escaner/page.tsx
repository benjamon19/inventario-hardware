'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ScanLine, 
  Search, 
  X, 
  Loader2, 
  ArrowUpRight, 
  ArrowDownLeft,
  AlertCircle,
  CheckCircle2,
  History,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ITEMS_PER_PAGE = 5;

export default function AdminScannerPage() {
  const router = useRouter();
  
  // --- NUEVO: Estado del Modo ---
  const [scanMode, setScanMode] = useState<'TRANSACTION' | 'SEARCH'>('TRANSACTION');

  const [manualSku, setManualSku] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchActivity(currentPage);
  }, [currentPage]);

  // AUTO-FOCUS
  useEffect(() => {
    if (isScanning && !selectedItem) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isScanning, selectedItem]);

  // AUTO-SUBMIT
  useEffect(() => {
    const skuValido = /^[A-Z0-9]{2,5}-\d{4}$/i.test(manualSku.trim());
    if (skuValido) {
      const timer = setTimeout(() => {
        processSku(manualSku.trim().toUpperCase());
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [manualSku]);

  const fetchActivity = async (page: number) => {
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE - 1;

    const { data, count } = await supabase
      .from('transacciones')
      .select(`
        id, tipo, timestamp, sku,
        hardware (modelo)
      `, { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(start, end);
    
    if (data) {
      setRecentActivity(data);
      setHasMore(count ? count > end + 1 : false);
    }
  };

  const processSku = async (sku: string) => {
    if (!sku) return;

    inputRef.current?.blur(); // Ocultar teclado

    // --- NUEVO: Si estamos en modo búsqueda, saltar al inventario ---
    if (scanMode === 'SEARCH') {
      router.push(`/admin/inventario?sku=${sku}`);
      return;
    }

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
    
    // 1. Guardar en transacciones
    const { error: transError } = await supabase
      .from('transacciones')
      .insert([{
        sku: selectedItem.sku,
        hardware_id: selectedItem.id, 
        operador_id: user.id,        
        tipo: tipo,
        timestamp: new Date().toISOString()
      }]);

    // 2. Actualizar estado del hardware
    const nuevoEstado = tipo === 'SALIDA' ? 'EN_USO' : 'DISPONIBLE';
    const { error: hwError } = await supabase
      .from('hardware')
      .update({ estado: nuevoEstado })
      .eq('sku', selectedItem.sku);

    if (!transError && !hwError) {
      // --- NUEVO: Registro en Auditoría ---
      await supabase.from('auditoria_logs').insert([{
        accion: tipo, // Guardará 'INGRESO' o 'SALIDA'
        entidad: 'HARDWARE',
        usuario_id: user.id,
        detalles: {
          sku: selectedItem.sku,
          modelo: selectedItem.modelo,
          notas: `Cambio de estado desde Escáner. Nuevo estado: ${nuevoEstado}`
        }
      }]);
      // ------------------------------------

      setStatusMsg({ type: 'success', text: `${tipo} registrado con éxito.` });
      setSelectedItem(null);
      setIsScanning(true);
      setManualSku(''); 
      setCurrentPage(0);
      fetchActivity(0);
    } else {
      setStatusMsg({ type: 'error', text: 'Error al registrar el movimiento.' });
    }
    
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-3 pt-2 sm:pt-4 pb-16">
      
      {/* --- NUEVO: TABS DE MODO --- */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl mb-4">
        <button
          onClick={() => { setScanMode('TRANSACTION'); setSelectedItem(null); setIsScanning(true); }}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
            scanMode === 'TRANSACTION' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" /> Mover Stock
        </button>
        <button
          onClick={() => { setScanMode('SEARCH'); setSelectedItem(null); setIsScanning(true); }}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
            scanMode === 'SEARCH' ? 'bg-white text-violet-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'
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
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 pointer-events-none">
              <div className={`h-28 w-28 border-2 border-dashed rounded-2xl animate-pulse flex items-center justify-center bg-black/10 ${
                scanMode === 'SEARCH' ? 'border-violet-500' : 'border-blue-500'
              }`}>
                 {scanMode === 'SEARCH' 
                   ? <Search className="h-8 w-8 text-violet-500 drop-shadow-md" />
                   : <ScanLine className="h-8 w-8 text-blue-500 drop-shadow-md" />
                 }
              </div>
              <p className="mt-2 text-[11px] font-medium bg-black/60 px-3 py-1 rounded-full text-white shadow-sm">
                {scanMode === 'SEARCH' ? 'Enfoca para buscar' : 'Enfoca para mover'}
              </p>
            </div>
          </div>
        ) : selectedItem && (
          <div className="p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                 selectedItem.estado === 'DISPONIBLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                {selectedItem.estado}
              </span>
              <button onClick={() => { setIsScanning(true); setSelectedItem(null); setManualSku(''); }} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{selectedItem.modelo}</h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">SKU: {selectedItem.sku}</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
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
            </div>
          </div>
        )}

        <div className="border-t border-slate-50 p-2.5 bg-slate-50/50 relative z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input 
              ref={inputRef}
              type="text" 
              placeholder={scanMode === 'SEARCH' ? "Ingresa SKU para buscar..." : "Pistola o manual..."}
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && processSku(manualSku)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-500 transition-all shadow-sm font-mono uppercase"
            />
            {loading && <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-blue-500" />}
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className={`flex items-center gap-2 rounded-xl p-3 border animate-in slide-in-from-top-2 ${
          statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <p className="text-xs font-semibold">{statusMsg.text}</p>
        </div>
      )}

      {/* ÚLTIMOS MOVIMIENTOS GLOBALES PAGINADOS */}
      {scanMode === 'TRANSACTION' && (
        <div className="space-y-2 mt-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <History className="h-3 w-3 text-slate-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Actividad Bodega</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => p - 1)} 
                disabled={currentPage === 0}
                className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 disabled:opacity-30 disabled:bg-slate-50 shadow-sm cursor-pointer"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="text-[10px] font-bold text-slate-400">{currentPage + 1}</span>
              <button 
                onClick={() => setCurrentPage(p => p + 1)} 
                disabled={!hasMore}
                className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 disabled:opacity-30 disabled:bg-slate-50 shadow-sm cursor-pointer"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {recentActivity.map((mov) => (
              <div key={mov.id} className="flex items-start justify-between rounded-xl bg-white p-2.5 border border-slate-100 shadow-sm gap-2">
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
            {recentActivity.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400 italic">No hay movimientos registrados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}