'use client';

import { useState, useEffect, Fragment, useMemo, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Pencil, Plus, Minus, Check, Trash2, MapPin, Camera, ScanLine, Type, Sparkles, AlertCircle } from 'lucide-react';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { Scanner } from '@yudiel/react-qr-scanner';

// --- Tipos ---
type Categoria = { id: string; nombre: string; prefijo: string };
type Estado = { id: string; nombre: string; color: string };
type Ubicacion = { id: string; nombre: string };

// Resultado que devuelve la IA al analizar un QR o imagen
type ScanResult = {
  modelo: string | null;
  numero_serie: string | null;
  confianza: number;
  razonamiento: string;
};

const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100',
};
const colorOptions = ['emerald', 'blue', 'amber', 'red', 'violet', 'slate'];

// ─────────────────────────────────────────────────────────
// Helper: llama al backend /api/scan (Gemini)
// ─────────────────────────────────────────────────────────

async function processScan(mode: 'qr' | 'ocr', payload: string): Promise<ScanResult> {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, payload }),
  });
  if (!response.ok) throw new Error('Error al analizar con IA');
  return await response.json() as ScanResult;
}

// ─────────────────────────────────────────────────────────
// Sub-componente: Editor inline
// ─────────────────────────────────────────────────────────

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
                className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${newExtra === c ? 'border-slate-500 scale-110' : 'border-transparent'} ${colorClasses[c]}`}
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
            {saving
              ? <div className="flex h-3.5 w-3.5 items-center justify-center"><TailChase size="14" speed="1.75" color="white" /></div>
              : <><Check className="h-3.5 w-3.5" /> Agregar</>
            }
          </button>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-componente: Toast de resultado del scanner
// ─────────────────────────────────────────────────────────

function ScanResultToast({
  result,
  onApply,
  onDismiss,
}: {
  result: ScanResult;
  onApply: (modelo: string, serie: string) => void;
  onDismiss: () => void;
}) {
  const confColor =
    result.confianza >= 80 ? 'text-slate-700 bg-slate-100 border-slate-300' :
      result.confianza >= 50 ? 'text-slate-500 bg-slate-50 border-slate-200' :
        'text-slate-400 bg-white border-slate-200';

  return (
    <div className="mx-4 sm:mx-6 mt-3 mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Wall detectó</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confColor}`}>
            {result.confianza}% confianza
          </span>
          <button onClick={onDismiss} className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Campos detectados */}
      <div className="space-y-1.5">
        {result.modelo && (
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 shrink-0 w-12">Modelo</span>
            <span className="text-xs font-semibold text-slate-800 leading-snug">{result.modelo}</span>
          </div>
        )}
        {result.numero_serie && (
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 shrink-0 w-12">N° Serie</span>
            <span className="text-xs font-mono font-bold text-slate-700">{result.numero_serie}</span>
          </div>
        )}
        {!result.modelo && !result.numero_serie && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs">No se detectó información de hardware útil.</span>
          </div>
        )}
      </div>

      {/* Razonamiento */}
      {result.razonamiento && (
        <p className="text-[11px] text-slate-500 leading-snug border-t border-slate-200 pt-2">
          {result.razonamiento}
        </p>
      )}

      {/* Acciones */}
      {(result.modelo || result.numero_serie) && (
        <div className="flex gap-2 pt-0.5">
          <button
            onClick={() => onApply(result.modelo ?? '', result.numero_serie ?? '')}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-1.5 text-[11px] font-bold text-white hover:bg-black transition-colors cursor-pointer"
          >
            <Check className="h-3 w-3" /> Aplicar al formulario
          </button>
          <button
            onClick={onDismiss}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Descartar
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Componente Modal Principal
// ─────────────────────────────────────────────────────────

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

  // 'off' | 'qr' | 'ocr'
  const [scanMode, setScanMode] = useState<'off' | 'qr' | 'ocr'>('off');

  // Estado del scanner inteligente
  const [isIALoading, setIsIALoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Evitar que el QR scanner dispare múltiples veces seguidas
  const lastScannedRef = useRef<string>('');
  const scanCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Listas ordenadas
  const sortedCategorias = useMemo(() => [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre)), [categorias]);
  const sortedEstados = useMemo(() => [...estados].sort((a, b) => a.nombre.localeCompare(b.nombre)), [estados]);
  const sortedUbicaciones = useMemo(() => [...ubicaciones].sort((a, b) => a.nombre.localeCompare(b.nombre)), [ubicaciones]);

  const generarSKU = (prefijo: string) => `${prefijo}-${Math.floor(1000 + Math.random() * 9000)}`;

  // ── Cámara ──────────────────────────────────────────────

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanMode('off');
    setIsIALoading(false);
  };

  // Para el stream de video sin cerrar el panel (usado durante la captura OCR)
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startOcrCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 50);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setScanError('No se pudo acceder a la cámara. Verifica los permisos.');
      setScanMode('off');
    }
  };

  // ── Reset al abrir/cerrar ───────────────────────────────

  useEffect(() => {
    if (isOpen) {
      const defaultCat = sortedCategorias[0]?.nombre ?? '';
      const defaultEst = sortedEstados[0]?.nombre ?? '';
      setFormData({ categoria: defaultCat, modelo: '', estado: defaultEst, ubicacion: '' });
      setCantidad(1);
      const prefijo = categorias.find(c => c.nombre === defaultCat)?.prefijo ?? 'HW';
      setEquipos([{ id: Date.now(), sku: generarSKU(prefijo), descripcion: '', numero_serie: '' }]);
      setShowCatEditor(false);
      setShowEstEditor(false);
      setShowUbicEditor(false);
      setScanResult(null);
      setScanError(null);
      stopCamera();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  useEffect(() => {
    const cat = categorias.find(c => c.nombre === formData.categoria);
    if (cat) {
      setEquipos(prev => prev.map(eq => ({ ...eq, sku: generarSKU(cat.prefijo) })));
    }
  }, [formData.categoria, categorias]);

  // ── Cantidad ────────────────────────────────────────────

  const handleCantidadChange = (nuevaCantidad: number) => {
    if (nuevaCantidad < 1 || nuevaCantidad > 20) return;
    setCantidad(nuevaCantidad);
    setEquipos(prev => {
      const cat = categorias.find(c => c.nombre === formData.categoria);
      const prefijo = cat?.prefijo ?? 'HW';
      if (nuevaCantidad > prev.length) {
        const nuevos = Array.from({ length: nuevaCantidad - prev.length }).map((_, i) => ({
          id: Date.now() + i,
          sku: generarSKU(prefijo),
          descripcion: '',
          numero_serie: ''
        }));
        return [...prev, ...nuevos];
      }
      return prev.slice(0, nuevaCantidad);
    });
  };

  const updateEquipo = (id: number, field: 'sku' | 'descripcion' | 'numero_serie', value: string) => {
    setEquipos(prev => prev.map(eq => eq.id === id ? { ...eq, [field]: value } : eq));
  };

  // ── Wrappers add con auto-select ────────────────────────

  const handleAddCategoria = async (nombre: string, extra?: Record<string, string>) => {
    await addCategoria(nombre, extra);
    setFormData(prev => ({ ...prev, categoria: nombre }));
  };

  const handleAddEstado = async (nombre: string, extra?: Record<string, string>) => {
    await addEstado(nombre, extra);
    setFormData(prev => ({ ...prev, estado: nombre.toUpperCase() }));
  };

  const handleAddUbicacion = async (nombre: string) => {
    await addUbicacion(nombre);
    setFormData(prev => ({ ...prev, ubicacion: nombre }));
  };

  // ── Aplicar resultado de IA al formulario ───────────

  const applyResult = (modelo: string, serie: string) => {
    if (modelo) setFormData(prev => ({ ...prev, modelo: modelo.substring(0, 150) }));
    if (serie) {
      // Aplicar el número de serie al primer equipo de la lista
      setEquipos(prev => prev.map((eq, i) => i === 0 ? { ...eq, numero_serie: serie.substring(0, 100) } : eq));
    }
    setScanResult(null);
  };

  // ── QR Scanner con Gemini ───────────────────────────────

  const handleScan = async (result: any) => {
    if (!result || result.length === 0 || isIALoading) return;

    const scannedText: string = result[0]?.rawValue ?? '';
    if (!scannedText || scannedText === lastScannedRef.current) return;

    lastScannedRef.current = scannedText;
    if (scanCooldownRef.current) clearTimeout(scanCooldownRef.current);
    scanCooldownRef.current = setTimeout(() => { lastScannedRef.current = ''; }, 3000);

    setScanError(null);
    setScanResult(null);
    setIsIALoading(true);

    try {
      const extracted = await processScan('qr', scannedText);
      setScanResult(extracted);
    } catch (err) {
      console.error('Error Gemini QR:', err);
      setScanError('No se pudo analizar el QR. Intenta de nuevo.');
    } finally {
      setIsIALoading(false);
    }
  };

  // ── OCR con Gemini Vision ───────────────────────────────

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setScanError(null);
    setScanResult(null);
    setIsIALoading(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setIsIALoading(false); return; }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Solo para el stream; el panel OCR permanece visible con el spinner
    stopCameraStream();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];

    try {
      const extracted = await processScan('ocr', base64);
      setScanResult(extracted);
    } catch (err) {
      console.error('Error Gemini Vision:', err);
      setScanError('No se pudo leer la imagen. Intenta con mejor iluminación.');
    } finally {
      setIsIALoading(false);
      // Cerrar el panel de cámara solo cuando ya terminó
      setScanMode('off');
    }
  };

  // ── Submit ──────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const equipoSchema = z.object({
      categoria: z.string().min(1, 'La categoría es obligatoria'),
      estado: z.string().min(1, 'El estado es obligatorio'),
      modelo: z.string().trim().min(1, 'El modelo es obligatorio').max(150, 'El modelo no puede exceder los 150 caracteres'),
      ubicacion: z.string().optional(),
      equipos: z.array(z.object({
        sku: z.string().trim().min(1, 'El SKU es obligatorio').max(50, 'El SKU no puede exceder 50 caracteres'),
        descripcion: z.string().max(255, 'La descripción no puede exceder 255 caracteres').optional(),
        numero_serie: z.string().max(100, 'El N° de serie no puede exceder 100 caracteres').optional(),
      })).min(1, 'Debe registrar al menos un equipo'),
    });

    const validacion = equipoSchema.safeParse({ ...formData, equipos });
    if (!validacion.success) {
      alert('Por favor corrige los siguientes errores:\n' + validacion.error.issues.map(e => `- ${e.message}`).join('\n'));
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
          notas: eq.descripcion || 'Registro inicial en el sistema',
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

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 z-[101] overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-400 sm:duration-500" enterFrom="translate-x-full" enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-400 sm:duration-500" leaveFrom="translate-x-0" leaveTo="translate-x-full"
              >
                <Dialog.Panel id="tour-modal-nuevo-equipo" className="pointer-events-auto w-screen sm:max-w-[400px] lg:max-w-md flex">
                  <div className="flex h-full w-full flex-col bg-white shadow-2xl overflow-hidden">

                    {/* ── Cabecera ── */}
                    <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <Dialog.Title as="h3" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                          Registrar Equipo
                        </Dialog.Title>
                        <div className="sm:hidden ml-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (scanMode !== 'off') {
                                stopCamera();
                                setScanResult(null);
                                setScanError(null);
                              } else {
                                setScanMode('qr');
                                setScanResult(null);
                                setScanError(null);
                              }
                            }}
                            className={`relative flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${scanMode !== 'off'
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            title="Cámara inteligente"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Cámara</span>
                            <span className={`absolute -top-1.5 -right-1.5 text-[7px] font-black uppercase tracking-widest px-1 py-px rounded-full leading-none shadow ${scanMode !== 'off' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                              }`}>Beta</span>
                          </button>
                        </div>
                      </div>
                      <button onClick={onClose} className="rounded-full p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>

                    {/* ── Panel de cámara — solo mobile ── */}
                    {scanMode !== 'off' && (
                      <div className="sm:hidden w-full border-b border-slate-200">
                        {/* Tabs QR / Texto */}
                        <div className="flex border-b border-slate-100 bg-white">
                          <button
                            type="button"
                            onClick={() => {
                              if (scanMode === 'ocr') { stopCamera(); setScanMode('qr'); }
                              setScanResult(null); setScanError(null);
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${scanMode === 'qr' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                              }`}
                          >
                            <ScanLine className="h-3.5 w-3.5" /> QR
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (scanMode === 'qr') {
                                setScanMode('ocr');
                                setScanResult(null); setScanError(null);
                                await startOcrCamera();
                              }
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${scanMode === 'ocr' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                              }`}
                          >
                            <Type className="h-3.5 w-3.5" /> Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => { stopCamera(); setScanResult(null); setScanError(null); }}
                            className="px-3 text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Modo QR */}
                        {scanMode === 'qr' && (
                          <div className="relative h-48 bg-slate-100 w-full overflow-hidden">
                            <Scanner onScan={handleScan} components={{ finder: false }} sound={false} />
                            {/* Spinner minimalista mientras IA procesa */}
                            {isIALoading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                                <TailChase size="22" speed="1.75" color="#cbd5e1" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              {!isIALoading && (
                                <>
                                  <div className="h-28 w-28 border-2 border-dashed border-slate-400 rounded-2xl animate-pulse flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                    <ScanLine className="h-8 w-8 text-slate-500 drop-shadow-sm" />
                                  </div>
                                  <p className="mt-3 text-[11px] font-bold bg-white/90 border border-slate-200 px-3.5 py-1.5 rounded-full text-slate-900 shadow-sm backdrop-blur-md">
                                    Enfoca el QR
                                  </p>
                                  <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                                    Potenciado con IA
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Modo OCR / Foto */}
                        {scanMode === 'ocr' && (
                          <div className="relative h-48 bg-slate-900 w-full overflow-hidden">
                            {/* Video en vivo (oculto durante el loading) */}
                            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            {isIALoading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                                <TailChase size="22" speed="1.75" color="#cbd5e1" />
                              </div>
                            )}
                            {!isIALoading && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="h-28 w-44 border-2 border-dashed border-slate-400 rounded-2xl flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                  <Type className="h-8 w-8 text-slate-500 drop-shadow-sm opacity-60" />
                                </div>
                                <div className="mt-3 pointer-events-auto flex flex-col items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={captureAndAnalyze}
                                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-md hover:bg-slate-50 transition-colors cursor-pointer"
                                  >
                                    <Camera className="h-3.5 w-3.5" /> Capturar texto
                                  </button>
                                  <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                                    Potenciado con IA
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Toast resultado de IA ── */}
                    {scanResult && (
                      <ScanResultToast
                        result={scanResult}
                        onApply={applyResult}
                        onDismiss={() => setScanResult(null)}
                      />
                    )}

                    {/* ── Error del scanner ── */}
                    {scanError && (
                      <div className="mx-4 sm:mx-6 mb-2 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {scanError}
                        <button onClick={() => setScanError(null)} className="ml-auto cursor-pointer"><X className="h-3 w-3" /></button>
                      </div>
                    )}

                    {/* ── Formulario ── */}
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
                              <button type="button" onClick={() => handleCantidadChange(cantidad - 1)} disabled={cantidad <= 1} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer">
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-4 text-center font-bold text-sm text-slate-800">{cantidad}</span>
                              <button type="button" onClick={() => handleCantidadChange(cantidad + 1)} disabled={cantidad >= 20} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer">
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Listado de equipos */}
                        <div className="border-t border-slate-100 pt-2 sm:pt-3 space-y-4">
                          {equipos.map((eq, index) => (
                            <div key={eq.id} className={cantidad > 1 ? 'relative p-3 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 sm:space-y-4' : 'space-y-3 sm:space-y-4'}>
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
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  N° Serie <span className="font-normal text-[10px] ml-1 normal-case">(Opcional)</span>
                                </label>
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
                                  placeholder={cantidad > 1 ? 'Número de serie o detalle...' : 'Motivo de ingreso, estado de mantención...'}
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
                            {loading
                              ? <div className="flex h-5 w-5 items-center justify-center"><TailChase size="20" speed="1.75" color="white" /></div>
                              : <><Plus className="h-5 w-5" /> Guardar Equipo{cantidad > 1 ? 's' : ''}</>
                            }
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