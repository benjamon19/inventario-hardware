'use client';

import { useState } from 'react';
import { 
  ScanLine, 
  Search, 
  X, 
  Loader2, 
  ArrowUpRight, 
  ArrowDownLeft,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function AdminScannerPage() {
  const [manualSku, setManualSku] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

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
    
    // 1. Obtenemos la data de forma súper segura
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    // 2. Validación: Si no hay usuario logueado, cancelamos para que no explote
    if (!user) {
      setStatusMsg({ type: 'error', text: 'Error: Se perdió la sesión. Recarga la página.' });
      setLoading(false);
      return;
    }

    // 3. Validación: Si el item seleccionado se perdió, cancelamos
    if (!selectedItem) {
      setStatusMsg({ type: 'error', text: 'Error: No hay ningún equipo seleccionado.' });
      setLoading(false);
      return;
    }
    
    // 4. Si todo está bien, insertamos en la BD
    const { error: transError } = await supabase
      .from('transacciones')
      .insert([{
        sku: selectedItem.sku,
        hardware_id: selectedItem.id, // Ya verificamos que selectedItem no es null
        operador_id: user.id,         // Ya verificamos que user no es null
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
      setManualSku(''); 
    } else {
      setStatusMsg({ type: 'error', text: 'Error al registrar el movimiento.' });
    }
    
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-4">
      {/* ÁREA DE ESCÁNER / BÚSQUEDA */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100">
        {isScanning ? (
          <div className="relative aspect-square bg-slate-900">
            <Scanner
              onScan={(result) => {
                if (result && result.length > 0) {
                  processSku(result[0].rawValue);
                }
              }}
              components={{
                finder: false 
              }}
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

        {/* Buscador Manual */}
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

      {/* Feedback de estado */}
      {statusMsg && (
        <div className={`flex items-center gap-3 rounded-2xl p-4 border animate-in slide-in-from-top-2 ${
          statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-semibold">{statusMsg.text}</p>
        </div>
      )}
    </div>
  );
}