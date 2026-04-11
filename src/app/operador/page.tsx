'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ScanLine, 
  Search, 
  History, 
  Package, 
  X, 
  Loader2, 
  ArrowUpRight, 
  ArrowDownLeft,
  AlertCircle,
  CheckCircle2,
  LogOut // Importamos el icono de salida
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react'; // Importamos para el modal
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function OperatorPage() {
  const router = useRouter();
  const [manualSku, setManualSku] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Estado para el modal
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [myActivity, setMyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchMyActivity();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fetchMyActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('transacciones')
      .select(`
        id, tipo, timestamp, sku,
        hardware (modelo)
      `)
      .eq('operador_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(5);
    
    if (data) setMyActivity(data);
  };

  const processSku = async (sku: string) => {
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
      setStatusMsg({ type: 'success', text: `Movimiento de ${tipo.toLowerCase()} registrado con éxito.` });
      setSelectedItem(null);
      setIsScanning(true);
      fetchMyActivity();
    } else {
      setStatusMsg({ type: 'error', text: 'Error al registrar el movimiento.' });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 pb-24">
      {/* Header Operador con Cerrar Sesión */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Package className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Escáner de Bodega</h1>
        </div>
        
        {/* Botón de Cerrar Sesión (Icono) */}
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500 border border-slate-200 shadow-sm hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto max-w-lg space-y-6">
        
        {/* ÁREA DE ESCÁNER (Se mantiene igual) */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100">
          {isScanning ? (
            <div className="relative aspect-square bg-slate-900">
              <Scanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                    processSku(result[0].rawValue);
                  }
                }}
                components={{ finder: false }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 pointer-events-none">
                <div className="h-48 w-48 border-2 border-dashed border-blue-500 rounded-3xl animate-pulse flex items-center justify-center bg-black/10">
                   <ScanLine className="h-10 w-10 text-blue-500 drop-shadow-md" />
                </div>
                <p className="mt-4 text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md text-white shadow-sm">
                  Enfoca el código QR o Barra
                </p>
              </div>
            </div>
          ) : selectedItem && (
            <div className="p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold border ${
                   selectedItem.estado === 'DISPONIBLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  ESTADO: {selectedItem.estado}
                </span>
                <button onClick={() => { setIsScanning(true); setSelectedItem(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900">{selectedItem.modelo}</h2>
              <p className="text-sm font-mono text-slate-500 mt-1">SKU: {selectedItem.sku}</p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => registrarMovimiento('SALIDA')}
                  disabled={loading || selectedItem.estado === 'EN_USO'}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-amber-50 p-4 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <ArrowUpRight className="h-6 w-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Retirar</span>
                </button>
                <button 
                  onClick={() => registrarMovimiento('INGRESO')}
                  disabled={loading || selectedItem.estado === 'DISPONIBLE'}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <ArrowDownLeft className="h-6 w-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Devolver</span>
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-slate-50 p-4 bg-slate-50/50 relative z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="O ingresar SKU manualmente..."
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && processSku(manualSku)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition-all shadow-sm"
              />
              {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500" />}
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className={`flex items-center gap-3 rounded-2xl p-4 border animate-in slide-in-from-top-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <p className="text-sm font-semibold">{statusMsg.text}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <History className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Mis últimos movimientos</h3>
          </div>
          
          <div className="space-y-2">
            {myActivity.map((mov) => (
              <div key={mov.id} className="flex items-center justify-between rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${mov.tipo === 'SALIDA' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {mov.tipo === 'SALIDA' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{mov.hardware?.modelo}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{format(new Date(mov.timestamp), "HH:mm '•' d 'de' MMM", { locale: es })}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border">{mov.sku}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE LOGOUT (Idéntico al de Admin) */}
      <Transition show={showLogoutModal} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={() => setShowLogoutModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/60 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-6 pb-8 pt-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-8 border border-slate-100">
                  <div className="absolute right-5 top-5">
                    <button type="button" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors" onClick={() => setShowLogoutModal(false)}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-950 tracking-tight">¿Cerrar sesión ahora?</Dialog.Title>
                      <p className="mt-2.5 text-sm text-slate-500 font-medium">Tendrás que ingresar tus credenciales nuevamente para acceder.</p>
                    </div>
                  </div>
                  <div className="mt-8 flex flex-col gap-3">
                    <button type="button" onClick={handleLogout} className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer shadow-lg shadow-red-200 transition-all">Sí, salir</button>
                    <button type="button" onClick={() => setShowLogoutModal(false)} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm transition-all">Cancelar</button>
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