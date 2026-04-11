'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Search, Printer, Package, QrCode, Laptop, Monitor, Cpu, HardDrive, Tablet, Keyboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

export default function GenerarQRPage() {
  const [sku, setSku] = useState('');
  const [item, setItem] = useState<any>(null);
  const [disponibles, setDisponibles] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('hardware')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setDisponibles(data); });
  }, []);

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

  return (
    <>
      {/* ===== ESTILOS DE IMPRESIÓN ===== */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #etiqueta-print, #etiqueta-print * { visibility: visible !important; }
          #etiqueta-print {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
          }
        }
      `}</style>

      {/* ===== ETIQUETA OCULTA PARA IMPRIMIR ===== */}
      {item && (
        <div id="etiqueta-print" style={{ display: 'none' }}>
          <div style={{
            width: '260px',
            background: 'white',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            overflow: 'hidden',
            fontFamily: 'system-ui, sans-serif',
          }}>
            {/* Header azul */}
            <div style={{ background: '#1e40af', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Inventario</p>
                <p style={{ color: 'white', fontSize: '13px', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>{item.sku}</p>
              </div>
            </div>

            {/* QR centrado */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <QRCodeSVG value={item.sku} size={160} level="H" includeMargin={false} />
            </div>

            {/* Datos */}
            <div style={{ padding: '12px 16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.modelo}</p>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{item.categoria}</p>
            </div>

            {/* Footer */}
            <div style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Escanea para identificar</p>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.estado === 'DISPONIBLE' ? '#10b981' : '#3b82f6' }} />
            </div>
          </div>
        </div>
      )}

      {/* ===== UI NORMAL ===== */}
      <div className="max-w-5xl mx-auto space-y-8">

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

        {/* Vista QR */}
        {item && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">

            {/* Preview de la etiqueta */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vista previa de etiqueta</p>
              {/* Tarjeta preview */}
              <div className="w-55 rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
                <div className="bg-blue-800 px-4 py-3 flex items-center gap-2.5">
                  <div className="bg-white/20 rounded-lg p-1.5">
                    <QrCode className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Inventario</p>
                    <p className="text-white text-xs font-black tracking-wide">{item.sku}</p>
                  </div>
                </div>
                <div className="bg-white px-4 py-4 flex justify-center border-b border-slate-100">
                  <QRCodeSVG value={item.sku} size={130} level="H" includeMargin={false} />
                </div>
                <div className="bg-white px-4 py-3">
                  <p className="text-slate-900 text-xs font-bold truncate">{item.modelo}</p>
                  <p className="text-slate-400 text-[10px] truncate">{item.categoria}</p>
                </div>
                <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex justify-between items-center">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Escanea para identificar</p>
                  <div className={`w-1.5 h-1.5 rounded-full ${item.estado === 'DISPONIBLE' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col justify-center gap-4">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-900 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Datos del equipo
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-blue-800">
                  <li><strong>Categoría:</strong> {item.categoria}</li>
                  <li><strong>Modelo:</strong> {item.modelo}</li>
                  <li><strong>Estado:</strong> {item.estado}</li>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-700">Todos los equipos</h2>
            <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1 rounded-full">{disponibles.length} registrados</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {disponibles.map((equipo) => {
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
                  </div>
                  <QrCode className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? 'text-blue-500' : 'text-slate-200 group-hover:text-blue-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}