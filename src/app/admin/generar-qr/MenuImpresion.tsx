'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Printer, Type, Move, Square, ChevronLeft, ChevronRight, Edit3, CopyCheck, WrapText, MonitorOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type ItemSettings = {
  width: number;
  height: number;
  fontSize: number;
  text: string;
  wrapText: boolean;
};

type MenuImpresionProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPrint: (settings: any) => void;
  selectedCount: number;
  selectedItems: any[];
};

const STORAGE_KEY = 'qr_print_settings_v3';

export default function MenuImpresion({ isOpen, onClose, onConfirmPrint, selectedCount, selectedItems }: MenuImpresionProps) {
  const [itemSettings, setItemSettings] = useState<Record<string, ItemSettings>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const [widthInput, setWidthInput] = useState('5');
  const [heightInput, setHeightInput] = useState('2.5');
  const [fontSizeInput, setFontSizeInput] = useState('12');

  const [globalWrap, setGlobalWrap] = useState(false);
  const activeItem = selectedItems[currentIndex] || { id: 'temp', sku: 'SKU-0000', modelo: 'Modelo de ejemplo', categoria: 'Categoría' };

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cargar inicial
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(STORAGE_KEY);
      let gW = 5, gH = 2.5, gFS = 12, gWp = false;
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          gW = parsed.width / 10;
          gH = parsed.height / 10;
          gFS = parsed.fontSize;
          gWp = parsed.wrapText !== undefined ? !!parsed.wrapText : true;
          setWidthInput(gW.toString());
          setHeightInput(gH.toString());
          setFontSizeInput(gFS.toString());
          setGlobalWrap(gWp);
        } catch (e) { console.error(e); }
      } else {
        // Valores por defecto si no hay guardados
        gWp = true;
        setGlobalWrap(true);
      }

      const initialSettings: Record<string, ItemSettings> = {};
      selectedItems.forEach(item => {
        initialSettings[item.id] = {
          width: gW, 
          height: gH, 
          fontSize: gFS, 
          wrapText: gWp,
          text: `${item.sku}\n${item.modelo}\n${item.categoria}${item.numero_serie ? `\nSN: ${item.numero_serie}` : ''}`
        };
      });
      setItemSettings(initialSettings);
      setCurrentIndex(0);

    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeItem.id && itemSettings[activeItem.id]) {
        const s = itemSettings[activeItem.id];
        setWidthInput(s.width.toString());
        setHeightInput(s.height.toString());
        setFontSizeInput(s.fontSize.toString());
    }
  }, [currentIndex, isOpen]);

  const current = itemSettings[activeItem.id] || {
    width: parseFloat(widthInput) || 0,
    height: parseFloat(heightInput) || 0,
    fontSize: parseInt(fontSizeInput) || 0,
    wrapText: globalWrap,
    text: activeItem.sku
  };

  const updateCurrent = (updates: Partial<ItemSettings>) => {
    const newCurrent = { ...current, ...updates };
    setItemSettings(prev => ({ ...prev, [activeItem.id]: newCurrent }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        width: newCurrent.width * 10,
        height: newCurrent.height * 10,
        fontSize: newCurrent.fontSize,
        wrapText: newCurrent.wrapText
    }));
  };

  // Atajos de teclado
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      if (!isInput) {
        if (e.key === 'ArrowLeft') setCurrentIndex(prev => (prev - 1 + selectedItems.length) % selectedItems.length);
        if (e.key === 'ArrowRight') setCurrentIndex(prev => (prev + 1) % selectedItems.length);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!isMobile) {
          onConfirmPrint({ items: itemSettings });
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, selectedItems.length, itemSettings, isMobile, onConfirmPrint, onClose]);


  const handleInputChange = (field: 'width' | 'height' | 'fontSize', value: string) => {
    if (field === 'width') {
        setWidthInput(value);
        updateCurrent({ width: parseFloat(value) || 0 });
    } else if (field === 'height') {
        setHeightInput(value);
        updateCurrent({ height: parseFloat(value) || 0 });
    } else {
        setFontSizeInput(value);
        updateCurrent({ fontSize: parseInt(value) || 0 });
    }
  };

  const applyToAll = () => {
    const newSettings: Record<string, ItemSettings> = {};
    selectedItems.forEach(item => {
        newSettings[item.id] = {
            ...current,
            text: itemSettings[item.id]?.text && itemSettings[item.id].text !== activeItem.sku
                ? itemSettings[item.id].text 
                : `${item.sku}\n${item.modelo}\n${item.categoria}${item.numero_serie ? `\nSN: ${item.numero_serie}` : ''}`
        };
    });
    setItemSettings(newSettings);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-6xl border border-slate-100 flex flex-col md:flex-row">
                
                <div className="w-full md:w-[360px] p-8 sm:p-10 flex flex-col gap-8 bg-white border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Personalizar</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ancho (cm)</label>
                            <input type="number" step="0.1" value={widthInput} onChange={(e) => handleInputChange('width', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Largo (cm)</label>
                            <input type="number" step="0.1" value={heightInput} onChange={(e) => handleInputChange('height', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white transition-colors" />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Letra (px)</label>
                            <input type="number" value={fontSizeInput} onChange={(e) => handleInputChange('fontSize', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Multilínea</label>
                            <button 
                                onClick={() => {
                                    const next = !current.wrapText;
                                    setGlobalWrap(next);
                                    updateCurrent({ wrapText: next });
                                }}
                                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${current.wrapText ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                            >
                                <WrapText className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <button onClick={applyToAll} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 text-[10px] font-black text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-widest">
                        <CopyCheck className="h-3.5 w-3.5" /> Aplicar a todas
                    </button>
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    {isMobile ? (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-3xl flex flex-col items-center gap-2 text-center">
                            <MonitorOff className="h-6 w-6 text-red-600" />
                            <p className="text-xs font-black text-red-900 uppercase tracking-tighter">Impresión Bloqueada</p>
                            <p className="text-[10px] text-red-600 font-bold leading-tight">Usa una computadora para imprimir etiquetas QR.</p>
                        </div>
                    ) : (
                        <button onClick={() => { onConfirmPrint({ items: itemSettings }); onClose(); }} className="w-full flex justify-center items-center gap-3 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xl shadow-slate-200">
                          <Printer className="h-5 w-5" /> {selectedItems.length > 1 ? 'Imprimir lote' : 'Imprimir etiqueta'}
                        </button>
                    )}
                    <button onClick={onClose} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest text-center">Cancelar</button>
                  </div>
                </div>

                <div className="flex-1 bg-slate-100 p-8 sm:p-12 flex flex-col items-center justify-between relative overflow-hidden">
                  <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm z-10">
                    <button onClick={() => setCurrentIndex((prev) => (prev - 1 + selectedItems.length) % selectedItems.length)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft className="h-5 w-5" /></button>
                    <span className="text-xs font-black text-slate-900">{currentIndex + 1} de {selectedItems.length}</span>
                    <button onClick={() => setCurrentIndex((prev) => (prev + 1) % selectedItems.length)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight className="h-5 w-5" /></button>
                  </div>

                  <div className="flex-1 flex items-center justify-center w-full my-8">
                    <div className="bg-white shadow-2xl flex flex-row items-center p-[1%] transition-all duration-300 overflow-hidden" style={{ width: `${current.width * 60}px`, height: `${current.height * 60}px`, minWidth: '150px', minHeight: '60px' }}>
                        <div style={{ height: '96%', aspectRatio: '1/1' }} className="flex items-center justify-center shrink-0">
                            <QRCodeSVG value={activeItem.sku} size={512} level="H" style={{ height: '100%', width: '100%' }} />
                        </div>
                        <div className="flex-1 flex items-center pl-[2%] pr-2 overflow-hidden h-full">
                            <p className="font-black text-slate-900 leading-[1.1]" style={{ fontSize: `${current.fontSize * 1.5}px`, whiteSpace: current.wrapText ? 'pre-wrap' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.text}</p>
                        </div>
                    </div>
                  </div>

                  <div className="w-full max-w-lg bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400"><Edit3 className="h-3 w-3" /> Texto de esta etiqueta</div>
                    <input type="text" value={current.text} onChange={(e) => updateCurrent({ text: e.target.value })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white transition-colors" />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
