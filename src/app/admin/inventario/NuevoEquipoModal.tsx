'use client';

import { useState, useEffect, Fragment, useMemo, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Pencil, Plus, Minus, Check, Trash2, MapPin, Camera, Type, Search } from 'lucide-react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { Scanner } from '@yudiel/react-qr-scanner';
import Tesseract from 'tesseract.js';

// --- Tipos ---
type Categoria = { id: string; nombre: string; prefijo: string };
type Estado = { id: string; nombre: string; color: string };
type Ubicacion = { id: string; nombre: string };

const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100',
};
const colorOptions = ['emerald', 'blue', 'amber', 'red', 'violet', 'slate'];

// =============================================
// Sub-componente: Editor inline
// =============================================
type InlineEditorProps = {
  items: { id: string; nombre: string;[key: string]: any }[];
  onAdd: (nombre: string, extra?: Record<string, string>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect?: (nombre: string) => void;
  extraField?: { key: string; label: string; type: 'text' | 'color-pick'; options?: string[] };
  onClose: () => void;
  title: string;
};

function InlineEditor({ items, onAdd, onDelete, onSelect, extraField, onClose, title }: InlineEditorProps) {
  const [newNombre, setNewNombre] = useState('');
  const [newExtra, setNewExtra] = useState(extraField?.options?.[0] ?? '');
  const [saving, setSaving] = useState(false);

  // Items ordenados alfabéticamente en el editor
  const sortedItems = useMemo(() => [...items].sort((a, b) => a.nombre.localeCompare(b.nombre)), [items]);

  const handleAdd = async () => {
    if (!newNombre.trim()) return;
    setSaving(true);
    await onAdd(newNombre.trim(), extraField ? { [extraField.key]: newExtra } : {});
    setNewNombre('');
    setSaving(false);
  };

  return (
    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">{title}</p>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {sortedItems.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 group cursor-pointer"
            onClick={() => { onSelect?.(item.nombre); onClose(); }}
          >
            <div className="flex items-center gap-2">
              {extraField?.type === 'color-pick' && (
                <span className={`w-2.5 h-2.5 rounded-full border ${colorClasses[item[extraField.key]] ?? 'bg-slate-200'}`} />
              )}
              <span className="text-sm font-semibold text-slate-700">{item.nombre}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg p-1 hover:bg-red-50 text-red-400 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-2 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Nueva opción</p>
        <input
          type="text"
          maxLength={100}
          placeholder="Nombre..."
          value={newNombre}
          onChange={e => setNewNombre(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white transition-all"
        />
        {extraField?.type === 'text' && (
          <input
            type="text"
            placeholder={`${extraField.label}`}
            value={newExtra}
            onChange={e => setNewExtra(e.target.value.toUpperCase())}
            maxLength={5}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono outline-none focus:border-slate-900 focus:bg-white transition-all"
          />
        )}
        {extraField?.type === 'color-pick' && (
          <div className="flex gap-2 px-1">
            {colorOptions.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewExtra(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${newExtra === c ? 'border-slate-500 scale-110' : 'border-transparent'
                  } ${colorClasses[c]}`}
              />
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newNombre.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
          >
            {saving ? <div className="flex h-3.5 w-3.5 items-center justify-center"><TailChase size="14" speed="1.75" color="white" /></div> : <><Check className="h-3.5 w-3.5" /> Agregar</>}
          </button>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// Componente Modal Exportado
// =============================================
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categorias: Categoria[];
  estados: Estado[];
  ubicaciones: Ubicacion[];
  addCategoria: (nombre: string, extra?: Record<string, string>) => Promise<void>;
  deleteCategoria: (id: string) => Promise<void>;
  addEstado: (nombre: string, extra?: Record<string, string>) => Promise<void>;
  deleteEstado: (id: string) => Promise<void>;
  addUbicacion: (nombre: string) => Promise<void>;
  deleteUbicacion: (id: string) => Promise<void>;
};

export default function NuevoEquipoModal({
  isOpen, onClose, onSuccess,
  categorias, estados, ubicaciones,
  addCategoria, deleteCategoria,
  addEstado, deleteEstado,
  addUbicacion, deleteUbicacion,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    categoria: '',
    modelo: '',
    estado: '',
    ubicacion: '',
  });

  const [cantidad, setCantidad] = useState(1);
  const [equipos, setEquipos] = useState<{ id: number; sku: string; descripcion: string; numero_serie: string }[]>([]);

  const [showCatEditor, setShowCatEditor] = useState(false);
  const [showEstEditor, setShowEstEditor] = useState(false);
  const [showUbicEditor, setShowUbicEditor] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showOcrCamera, setShowOcrCamera] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopOcrCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowOcrCamera(false);
  };

  // Listas ordenadas alfabéticamente
  const sortedCategorias = useMemo(() => [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre)), [categorias]);
  const sortedEstados = useMemo(() => [...estados].sort((a, b) => a.nombre.localeCompare(b.nombre)), [estados]);
  const sortedUbicaciones = useMemo(() => [...ubicaciones].sort((a, b) => a.nombre.localeCompare(b.nombre)), [ubicaciones]);

  const generarSKU = (prefijo: string) => `${prefijo}-${Math.floor(1000 + Math.random() * 9000)}`;

  useEffect(() => {
    if (isOpen) {
      const defaultCat = sortedCategorias[0]?.nombre ?? '';
      const defaultEst = sortedEstados[0]?.nombre ?? '';
      setFormData({
        categoria: defaultCat,
        modelo: '',
        estado: defaultEst,
        ubicacion: '',
      });
      setCantidad(1);
      const prefijo = categorias.find(c => c.nombre === defaultCat)?.prefijo ?? 'HW';
      setEquipos([{ id: Date.now(), sku: generarSKU(prefijo), descripcion: '', numero_serie: '' }]);
      setShowCatEditor(false);
      setShowEstEditor(false);
      setShowUbicEditor(false);
      setShowScanner(false);
      stopOcrCamera();
    } else {
      stopOcrCamera();
    }
  }, [isOpen, categorias, estados]);

  useEffect(() => {
    const cat = categorias.find(c => c.nombre === formData.categoria);
    if (cat) {
      setEquipos(prev => prev.map(eq => ({ ...eq, sku: generarSKU(cat.prefijo) })));
    }
  }, [formData.categoria, categorias]);

  const handleCantidadChange = (nuevaCantidad: number) => {
    if (nuevaCantidad < 1 || nuevaCantidad > 20) return;
    setCantidad(nuevaCantidad);
    setEquipos(prev => {
      const cat = categorias.find(c => c.nombre === formData.categoria);
      const prefijo = cat?.prefijo ?? 'HW';
      if (nuevaCantidad > prev.length) {
        const toAdd = nuevaCantidad - prev.length;
        const nuevos = Array.from({ length: toAdd }).map((_, i) => ({
          id: Date.now() + i,
          sku: generarSKU(prefijo),
          descripcion: '',
          numero_serie: ''
        }));
        return [...prev, ...nuevos];
      } else {
        return prev.slice(0, nuevaCantidad);
      }
    });
  };

  const updateEquipo = (id: number, field: 'sku' | 'descripcion' | 'numero_serie', value: string) => {
    setEquipos(prev => prev.map(eq => eq.id === id ? { ...eq, [field]: value } : eq));
  };

  // Wrapper para addCategoria que auto-selecciona la nueva categoría
  const handleAddCategoria = async (nombre: string, extra?: Record<string, string>) => {
    await addCategoria(nombre, extra);
    // Auto-seleccionar la nueva categoría recién creada
    setFormData(prev => ({ ...prev, categoria: nombre }));
  };

  // Wrapper para addEstado que auto-selecciona el nuevo estado
  const handleAddEstado = async (nombre: string, extra?: Record<string, string>) => {
    await addEstado(nombre, extra);
    setFormData(prev => ({ ...prev, estado: nombre.toUpperCase() }));
  };

  // Wrapper para addUbicacion que auto-selecciona la nueva ubicación
  const handleAddUbicacion = async (nombre: string) => {
    await addUbicacion(nombre);
    setFormData(prev => ({ ...prev, ubicacion: nombre }));
  };

  const startOcrCamera = async () => {
    setShowScanner(false);
    setShowOcrCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      alert('No se pudo acceder a la cámara para capturar texto.');
      setShowOcrCamera(false);
    }
  };

  const captureAndOcr = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsOcrLoading(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setIsOcrLoading(false);
      return;
    }

    // Dibujar frame del video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopOcrCamera(); // Cerramos la cámara luego de capturar

    // Preprocesamiento para mejorar el OCR:
    // Convertir a escala de grises y aumentar contraste
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Luminancia (escala de grises perceptual)
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Umbral de contraste alto (128): si es más claro lo hace blanco, si no negro
      const bw = gray > 128 ? 255 : 0;
      data[i] = bw;
      data[i + 1] = bw;
      data[i + 2] = bw;
    }
    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    try {
      const result = await Tesseract.recognize(dataUrl, 'spa', {
        logger: () => {} // silenciar logs internos
      });
      const text = result.data.text.trim();
      if (text) {
        setEquipos(prev => {
          const newEquipos = [...prev];
          newEquipos[0].descripcion = text.substring(0, 255);
          return newEquipos;
        });
        if (!formData.modelo && text.length < 150) {
           setFormData(prev => ({ ...prev, modelo: text.split('\n')[0].substring(0, 150) }));
        }
      } else {
        alert('No se pudo reconocer texto en la imagen. Intenta con mejor iluminación y texto grande.');
      }
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
      alert('Hubo un error al procesar la imagen para extraer texto.');
    }
    setIsOcrLoading(false);
  };

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const scannedText: string = result[0].rawValue;
      if (!scannedText) return; // ignorar valores vacíos
      try {
        const data = JSON.parse(scannedText);
        
        if (data.modelo) setFormData(prev => ({ ...prev, modelo: data.modelo }));
        
        if (data.numero_serie || data.sku || data.descripcion || data.sn) {
          setEquipos(prev => {
            const newEquipos = [...prev];
            if (data.numero_serie) newEquipos[0].numero_serie = data.numero_serie;
            if (data.sn) newEquipos[0].numero_serie = data.sn;
            if (data.sku) newEquipos[0].sku = data.sku;
            if (data.descripcion) newEquipos[0].descripcion = data.descripcion;
            return newEquipos;
          });
        }
      } catch (e) {
        // No es JSON: heurística para adivinar qué campo rellenar
        setEquipos(prev => {
          const newEquipos = [...prev];
          // Regex para detectar patrones comunes de número de serie/código de producto
          if (/^[A-Za-z0-9_\-\.]{3,30}$/.test(scannedText.trim())) {
            newEquipos[0].numero_serie = scannedText.trim();
          } else {
            newEquipos[0].descripcion = scannedText.substring(0, 255);
          }
          return newEquipos;
        });
      }
      setShowScanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDACIÓN ESTRICTA CON ZOD
    const equipoSchema = z.object({
      categoria: z.string().min(1, "La categoría es obligatoria"),
      estado: z.string().min(1, "El estado es obligatorio"),
      modelo: z.string().trim().min(1, "El modelo es obligatorio").max(150, "El modelo no puede exceder los 150 caracteres"),
      ubicacion: z.string().optional(),
      equipos: z.array(z.object({
        sku: z.string().trim().min(1, "El SKU es obligatorio").max(50, "El SKU no puede exceder 50 caracteres"),
        descripcion: z.string().max(255, "La descripción no puede exceder 255 caracteres").optional(),
        numero_serie: z.string().max(100, "El N° de serie no puede exceder 100 caracteres").optional(),
      })).min(1, "Debe registrar al menos un equipo"),
    });

    const validacion = equipoSchema.safeParse({
      ...formData,
      equipos,
    });

    if (!validacion.success) {
      alert("Por favor corrige los siguientes errores:\n" + validacion.error.issues.map(err => `- ${err.message}`).join('\n'));
      return;
    }

    setLoading(true);

    const toInsert = equipos.map(eq => ({
      sku: eq.sku.trim(),
      categoria: formData.categoria,
      modelo: formData.modelo.trim(),
      estado: formData.estado,
      ubicacion: formData.ubicacion || null,
      descripcion: eq.descripcion.trim() || null,
      numero_serie: eq.numero_serie.trim() || null,
    }));

    const { data: insertedData, error } = await supabase.from('hardware').insert(toInsert).select();

    if (!error && insertedData) {
      const { data: { user } } = await supabase.auth.getUser();

      const logsToInsert = insertedData.map(eq => ({
        accion: 'CREAR',
        entidad: 'HARDWARE',
        usuario_id: user?.id,
        detalles: {
          sku: eq.sku,
          modelo: eq.modelo,
          categoria: eq.categoria,
          numero_serie: eq.numero_serie,
          notas: eq.descripcion || 'Registro inicial en el sistema'
        }
      }));

      await supabase.from('auditoria_logs').insert(logsToInsert);

      onSuccess();
      onClose();
    } else {
      alert('Error al guardar: ' + (error?.message || 'Error desconocido'));
    }
    setLoading(false);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 z-[101] overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-400 sm:duration-500" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-400 sm:duration-500" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <Dialog.Panel id="tour-modal-nuevo-equipo" className="pointer-events-auto w-screen sm:max-w-[400px] lg:max-w-md flex">
                  <div className="flex h-full w-full flex-col bg-white shadow-2xl overflow-hidden">
                    {/* Cabecera */}
                    <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <Dialog.Title as="h3" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Registrar Equipo</Dialog.Title>
                        <div className="sm:hidden flex items-center gap-1.5 ml-1">
                          <button 
                            type="button"
                            onClick={() => { stopOcrCamera(); setShowScanner(v => !v); }} 
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${showScanner ? 'bg-violet-600 text-white border-violet-700' : 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100'}`}
                            title="Escanear QR"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">QR</span>
                            <span className="text-[8px] font-black uppercase tracking-wider bg-violet-200 text-violet-800 px-1 py-0.5 rounded-md leading-none">Beta</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => showOcrCamera ? stopOcrCamera() : startOcrCamera()} 
                            disabled={isOcrLoading}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors disabled:opacity-50 ${showOcrCamera ? 'bg-blue-600 text-white border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'}`}
                            title="Extraer texto de foto"
                          >
                            {isOcrLoading ? <div className="h-3.5 w-3.5 flex items-center justify-center"><TailChase size="10" speed="1.75" color={showOcrCamera ? 'white' : '#1d4ed8'} /></div> : <Type className="h-3.5 w-3.5" />}
                            <span className="text-[10px] font-bold uppercase tracking-wider">Texto</span>
                            <span className="text-[8px] font-black uppercase tracking-wider bg-blue-200 text-blue-800 px-1 py-0.5 rounded-md leading-none">Beta</span>
                          </button>
                        </div>
                      </div>
                      <button onClick={onClose} className="rounded-full p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>

                    {showScanner && (
                      <div className="sm:hidden relative h-44 bg-slate-100 w-full overflow-hidden border-b border-slate-200">
                        <Scanner
                          onScan={handleScan}
                          components={{ finder: false }}
                          sound={false}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <div className="h-28 w-28 border-2 border-dashed border-violet-600 rounded-2xl animate-pulse flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                            <Search className="h-8 w-8 text-violet-600 drop-shadow-sm" />
                          </div>
                          <p className="mt-3 text-[11px] font-bold bg-white/90 border border-slate-200 px-3.5 py-1.5 rounded-full text-slate-900 shadow-sm backdrop-blur-md">
                            Enfoca un QR para autocompletar
                          </p>
                        </div>
                        {/* Badge Beta en esquina */}
                        <div className="absolute top-2 right-2 bg-violet-600 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow">
                          Beta
                        </div>
                      </div>
                    )}

                    {showOcrCamera && (
                      <div className="sm:hidden relative h-44 bg-slate-100 w-full overflow-hidden border-b border-slate-200">
                        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <div className="h-28 w-44 border-2 border-dashed border-blue-600 rounded-2xl flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                            <Type className="h-8 w-8 text-blue-600 drop-shadow-sm opacity-50" />
                          </div>
                          
                          <div className="mt-3 pointer-events-auto">
                            <button
                              type="button"
                              onClick={captureAndOcr}
                              disabled={isOcrLoading}
                              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-md hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                              {isOcrLoading ? (
                                <><TailChase size="14" speed="1.75" color="#0f172a" /> Analizando texto...</>
                              ) : (
                                <><Camera className="h-3.5 w-3.5" /> Capturar texto</>
                              )}
                            </button>
                          </div>
                        </div>
                        {/* Badge Beta en esquina */}
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow">
                          Beta
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
                      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-6 sm:pb-8">

                        {/* 1. Categoría */}
                        <div className="space-y-1 relative">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Categoría <span className="text-red-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => { setShowCatEditor(v => !v); setShowEstEditor(false); setShowUbicEditor(false); }}
                              className="flex items-center gap-1 text-[10px] font-bold text-slate-900 hover:text-black bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" /> Personalizar
                            </button>
                          </div>
                          <select
                            value={formData.categoria}
                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:py-3 text-[13px] sm:text-sm outline-none focus:border-slate-900 focus:bg-white transition-all font-semibold cursor-pointer"
                          >
                            {sortedCategorias.map(c => (
                              <option key={c.id} value={c.nombre}>{c.nombre}</option>
                            ))}
                          </select>
                          {showCatEditor && (
                            <InlineEditor
                              title="Categorías actuales"
                              items={sortedCategorias}
                              onAdd={handleAddCategoria}
                              onDelete={deleteCategoria}
                              onSelect={(nombre) => setFormData(prev => ({ ...prev, categoria: nombre }))}
                              extraField={{ key: 'prefijo', label: 'Prefijo SKU (ej: LAP)', type: 'text' }}
                              onClose={() => setShowCatEditor(false)}
                            />
                          )}
                        </div>

                        {/* 2. Estado */}
                        <div className="space-y-1 relative">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Estado <span className="text-red-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => { setShowEstEditor(v => !v); setShowCatEditor(false); setShowUbicEditor(false); }}
                              className="flex items-center gap-1 text-[10px] font-bold text-slate-900 hover:text-black bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" /> Personalizar
                            </button>
                          </div>
                          <select
                            value={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:py-3 text-[13px] sm:text-sm outline-none focus:border-slate-900 focus:bg-white transition-all font-semibold cursor-pointer"
                          >
                            {sortedEstados.map(e => (
                              <option key={e.id} value={e.nombre}>{e.nombre}</option>
                            ))}
                          </select>
                          {showEstEditor && (
                            <InlineEditor
                              title="Estados actuales"
                              items={sortedEstados}
                              onAdd={handleAddEstado}
                              onDelete={deleteEstado}
                              onSelect={(nombre) => setFormData(prev => ({ ...prev, estado: nombre }))}
                              extraField={{ key: 'color', label: 'Color del badge', type: 'color-pick', options: colorOptions }}
                              onClose={() => setShowEstEditor(false)}
                            />
                          )}
                        </div>

                        {/* 3. Modelo */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Modelo del Equipo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={150}
                            placeholder="Ej: Lenovo ThinkPad T14"
                            value={formData.modelo}
                            onChange={(e) => setFormData({ ...formData, modelo: e.target.value.trimStart() })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 font-semibold"
                          />
                        </div>

                        {/* 4. Ubicación */}
                        <div className="space-y-1 relative">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500">
                              <MapPin className="h-3.5 w-3.5" /> Ubicación
                              <span className="font-normal text-[10px] ml-1">(Opcional)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => { setShowUbicEditor(v => !v); setShowCatEditor(false); setShowEstEditor(false); }}
                              className="flex items-center gap-1 text-[10px] font-bold text-slate-900 hover:text-black bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" /> Gestionar
                            </button>
                          </div>
                          <select
                            value={formData.ubicacion}
                            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:py-3 text-[13px] sm:text-sm outline-none focus:border-slate-900 focus:bg-white transition-all font-semibold cursor-pointer"
                          >
                            <option value="">Sin asignar</option>
                            {sortedUbicaciones.map(u => (
                              <option key={u.id} value={u.nombre}>{u.nombre}</option>
                            ))}
                          </select>
                          {showUbicEditor && (
                            <InlineEditor
                              title="Ubicaciones en bodega"
                              items={sortedUbicaciones}
                              onAdd={async (nombre) => await handleAddUbicacion(nombre)}
                              onDelete={deleteUbicacion}
                              onSelect={(nombre) => setFormData(prev => ({ ...prev, ubicacion: nombre }))}
                              onClose={() => setShowUbicEditor(false)}
                            />
                          )}
                        </div>

                        {/* Cantidad */}
                        <div className="pt-1">
                          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Unidades a registrar
                            </label>
                            <div className="flex items-center gap-3">
                              <button type="button" onClick={() => handleCantidadChange(cantidad - 1)} disabled={cantidad <= 1} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 transition-colors"><Minus className="h-4 w-4" /></button>
                              <span className="w-4 text-center font-bold text-sm text-slate-800">{cantidad}</span>
                              <button type="button" onClick={() => handleCantidadChange(cantidad + 1)} disabled={cantidad >= 20} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 transition-colors"><Plus className="h-4 w-4" /></button>
                            </div>
                          </div>
                        </div>

                        {/* Listado de equipos (SKU y Notas) */}
                        <div className="border-t border-slate-100 pt-2 sm:pt-3 space-y-4">
                          {equipos.map((eq, index) => (
                            <div key={eq.id} className={cantidad > 1 ? "relative p-3 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 sm:space-y-4" : "space-y-3 sm:space-y-4"}>
                              {cantidad > 1 && (
                                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                  {index + 1}
                                </div>
                              )}
                              <div className="space-y-1">
                                <div className="flex justify-between items-end">
                                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Código SKU <span className="text-red-500">*</span></label>
                                  <span className="text-[10px] text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md">Auto-generado</span>
                                </div>
                                <input
                                  required
                                  type="text"
                                  maxLength={50}
                                  spellCheck="false"
                                  autoComplete="off"
                                  value={eq.sku}
                                  onChange={(e) => updateEquipo(eq.id, 'sku', e.target.value.trim().toUpperCase())}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm outline-none focus:border-slate-900 transition-all font-mono text-slate-700 font-bold tracking-wider"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">N° Serie <span className="font-normal text-[10px] ml-1 normal-case">(Opcional)</span></label>
                                <input
                                  type="text"
                                  maxLength={100}
                                  spellCheck="false"
                                  autoComplete="off"
                                  value={eq.numero_serie}
                                  onChange={(e) => updateEquipo(eq.id, 'numero_serie', e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm outline-none focus:border-slate-900 transition-all font-mono text-slate-700 font-bold tracking-wider"
                                  placeholder="Ej: SN-123"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Descripción / Notas</label>
                                <textarea
                                  maxLength={255}
                                  value={eq.descripcion}
                                  onChange={(e) => updateEquipo(eq.id, 'descripcion', e.target.value)}
                                  placeholder={cantidad > 1 ? "Número de serie o detalle..." : "Motivo de ingreso, estado de mantención..."}
                                  rows={2}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm outline-none focus:border-slate-900 transition-all resize-none text-slate-700"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-1">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 rounded-2xl bg-slate-900 py-3 sm:py-3.5 text-[13px] sm:text-sm font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {loading ? <div className="flex h-5 w-5 items-center justify-center"><TailChase size="20" speed="1.75" color="white" /></div> : <><Plus className="h-5 w-5" /> Guardar Equipo{cantidad > 1 ? 's' : ''}</>}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}