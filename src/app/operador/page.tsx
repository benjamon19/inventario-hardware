'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ScanLine, Search, History, Package, X, Loader2, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2, LogOut,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Scanner } from '@yudiel/react-qr-scanner';
import { usePresence } from '@/hooks/usePresence';

const ITEMS_PER_PAGE = 5;

export default function OperatorPage() {
  const router = useRouter();
  const [manualSku, setManualSku] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [myActivity, setMyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  usePresence();

  useEffect(() => {
    fetchMyActivity(currentPage);
  }, [currentPage]);

  // 1. AUTO-FOCUS
  useEffect(() => {
    if (isScanning && !selectedItem) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isScanning, selectedItem]);

  // 2. AUTO-SUBMIT
  useEffect(() => {
    const skuValido = /^[A-Z0-9]{2,5}-\d{4}$/i.test(manualSku.trim());
    if (skuValido) {
      const timer = setTimeout(() => {
        processSku(manualSku.trim().toUpperCase());
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [manualSku]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fetchMyActivity = async (page: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE - 1;

    const { data, count } = await supabase
      .from('transacciones')
      .select(`
        id, tipo, timestamp, sku,
        hardware (modelo)
      `, { count: 'exact' })
      .eq('operador_id', user.id)
      .order('timestamp', { ascending: false })
      .range(start, end);
    
    if (data) {
      setMyActivity(data);
      setHasMore(count ? count > end + 1 : false);
    }
  };

  const processSku = async (sku: string) => {
    if (!sku) return;

    // 3. AUTO-OCULTAR TECLADO
    inputRef.current?.blur();
    
    setLoading(true);
    setStatusMsg(null);
    
    const { data: item, error } = await supabase
      .from('hardware')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error || !item) {
      setStatusMsg({ type: 'error', text: 'Equipo no encontrado.' });
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
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error: transError } = await supabase
      .from('transacciones')
      .insert([{
        sku: selectedItem.sku,
        hardware_id: selectedItem.id,
        operador_id: user?.id,
        tipo: tipo,
        timestamp: new Date().toISOString()
      }]);

    const nuevoEstado = tipo === 'SALIDA' ? 'EN_USO' : 'DISPONIBLE';
    const { error: hwError } = await supabase
      .from('hardware')
      .update({ estado: nuevoEstado })
      .eq('sku', selectedItem.sku);

    if (!transError && !hwError) {
      // --- NUEVO: Registro en Auditoría ---
      await supabase.from('auditoria_logs').insert([{
        accion: tipo, // Registra automáticamente 'INGRESO' o 'SALIDA'
        entidad: 'HARDWARE',
        usuario_id: user?.id,
        detalles: {
          sku: selectedItem.sku,
          modelo: selectedItem.modelo,
          notas: `Movimiento vía Escáner. Estado: ${selectedItem.estado} -> ${nuevoEstado}`
        }
      }]);
      // ------------------------------------

      setStatusMsg({ type: 'success', text: `${tipo} registrado.` });
      setSelectedItem(null);
      setIsScanning(true);
      // Volvemos a la página 0 para ver el último movimiento
      setCurrentPage(0);
      fetchMyActivity(0);
    } else {
      setStatusMsg({ type: 'error', text: 'Error al registrar.' });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-2 sm:p-4 pb-16">
      {/* Header Operador Compacto */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-200">
            <Package className="h-4 w-4" />
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Escáner</h1>
        </div>
        
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-500 border border-slate-200 shadow-sm hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-auto max-w-lg space-y-3">
        
        {/* ÁREA DE ESCÁNER REDUCIDA */}
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
                <div className="h-28 w-28 border-2 border-dashed border-blue-500 rounded-2xl animate-pulse flex items-center justify-center bg-black/10">
                   <ScanLine className="h-8 w-8 text-blue-500 drop-shadow-md" />
                </div>
                <p className="mt-2 text-[11px] font-medium bg-black/60 px-3 py-1 rounded-full text-white shadow-sm">
                  Enfoca el código
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
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-amber-50 p-2.5 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-all disabled:opacity-50 shadow-sm"
                >
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Retirar</span>
                </button>
                <button 
                  onClick={() => registrarMovimiento('INGRESO')}
                  disabled={loading || selectedItem.estado === 'DISPONIBLE'}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-emerald-50 p-2.5 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50 shadow-sm"
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
                placeholder="Pistola o manual..."
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

        {/* ÚLTIMOS MOVIMIENTOS ENANOS Y PAGINADOS (Y AHORA ENVOLVENTES) */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <History className="h-3 w-3 text-slate-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mis movimientos</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => p - 1)} 
                disabled={currentPage === 0}
                className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 disabled:opacity-30 disabled:bg-slate-50 shadow-sm"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="text-[10px] font-bold text-slate-400">{currentPage + 1}</span>
              <button 
                onClick={() => setCurrentPage(p => p + 1)} 
                disabled={!hasMore}
                className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 disabled:opacity-30 disabled:bg-slate-50 shadow-sm"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {myActivity.map((mov) => (
              <div key={mov.id} className="flex items-start justify-between rounded-xl bg-white p-2.5 border border-slate-100 shadow-sm gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <div className={`shrink-0 mt-0.5 rounded-md p-1.5 ${mov.tipo === 'SALIDA' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {mov.tipo === 'SALIDA' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                  </div>
                  <div className="flex-1">
                    {/* SIN TRUNCATE Y CON LEADING-TIGHT PARA QUE EL TEXTO BAJE COMODAMENTE */}
                    <p className="text-xs font-bold text-slate-900 leading-tight">{mov.hardware?.modelo}</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">{format(new Date(mov.timestamp), "HH:mm '•' d MMM", { locale: es })}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border mt-0.5">{mov.sku}</span>
              </div>
            ))}
            {myActivity.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400 italic">No hay movimientos</div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE LOGOUT INTACTO */}
      <Transition show={showLogoutModal} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={() => setShowLogoutModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/60 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-5 pb-6 pt-5 text-left shadow-2xl transition-all w-full max-w-sm border border-slate-100">
                  <div className="absolute right-4 top-4">
                    <button type="button" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors" onClick={() => setShowLogoutModal(false)}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-bold text-slate-900">¿Cerrar sesión?</Dialog.Title>
                      <p className="mt-1.5 text-xs text-slate-500">Tendrás que ingresar de nuevo.</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-2">
                    <button type="button" onClick={handleLogout} className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-md shadow-red-200 transition-all">Sí, salir</button>
                    <button type="button" onClick={() => setShowLogoutModal(false)} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancelar</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </main>
  );
}