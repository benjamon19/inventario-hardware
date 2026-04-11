'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Search, Printer, Download, Package, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GenerarQRPage() {
  const [sku, setSku] = useState('');
  const [item, setItem] = useState<any>(null);

  const buscarEquipo = async () => {
    const { data } = await supabase.from('hardware').select('*').eq('sku', sku).single();
    setItem(data);
  };

  const imprimir = () => window.print();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Generador de Etiquetas QR</h1>
        <p className="text-slate-500 text-sm mt-1">Busca un equipo por SKU para generar su código de identificación.</p>
        
        <div className="mt-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Ingresa SKU (ej: SER-123456)"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarEquipo()}
            />
          </div>
          <button onClick={buscarEquipo} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer">
            Buscar
          </button>
        </div>
      </div>

      {item ? (
        <div className="grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-6">
            <div id="qr-to-print" className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-inner">
              <QRCodeSVG value={item.sku} size={200} level="H" includeMargin={true} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Etiqueta de Inventario</p>
              <h2 className="text-xl font-black text-slate-900">{item.sku}</h2>
              <p className="text-sm text-slate-500">{item.modelo}</p>
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
                <li><strong>Estado Actual:</strong> {item.estado}</li>
              </ul>
            </div>
            <button onClick={imprimir} className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all cursor-pointer">
              <Printer className="h-5 w-5" /> Imprimir Etiqueta
            </button>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
          <QrCode className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Busca un equipo para ver su QR</p>
        </div>
      )}
    </div>
  );
}