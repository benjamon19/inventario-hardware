'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, CheckCircle2, QrCode, Pencil, Plus, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// --- Tipos ---
type Categoria = { id: string; nombre: string; prefijo: string };
type Estado = { id: string; nombre: string; color: string };

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
// Sub-componente: Editor inline para dropdown
// =============================================
type InlineEditorProps = {
  items: { id: string; nombre: string; [key: string]: any }[];
  onAdd: (nombre: string, extra: Record<string, string>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect?: (nombre: string) => void;
  extraField?: { key: string; label: string; type: 'text' | 'color-pick'; options?: string[] };
  onClose: () => void;
};

function InlineEditor({ items, onAdd, onDelete, onSelect, extraField, onClose }: InlineEditorProps) {
  const [newNombre, setNewNombre] = useState('');
  const [newExtra, setNewExtra] = useState(extraField?.options?.[0] ?? '');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newNombre.trim()) return;
    setSaving(true);
    await onAdd(newNombre.trim(), extraField ? { [extraField.key]: newExtra } : {});
    setNewNombre('');
    setSaving(false);
  };

  return (
    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Opciones actuales</p>
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 group cursor-pointer" onClick={() => { onSelect?.(item.nombre); onClose(); }}>
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

      <div className="border-t border-slate-100 pt-2 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Agregar nueva</p>
        <input
          type="text"
          placeholder="Nombre..."
          value={newNombre}
          onChange={e => setNewNombre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
        {extraField?.type === 'text' && (
          <input
            type="text"
            placeholder={`${extraField.label} (ej: LAP)`}
            value={newExtra}
            onChange={e => setNewExtra(e.target.value.toUpperCase())}
            maxLength={5}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        )}
        {extraField?.type === 'color-pick' && (
          <div className="flex gap-2 px-1">
            {colorOptions.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewExtra(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                  newExtra === c ? 'border-slate-500 scale-110' : 'border-transparent'
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
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5" /> Agregar</>}
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
  addCategoria: (nombre: string, extra: Record<string, string>) => Promise<void>;
  deleteCategoria: (id: string) => Promise<void>;
  addEstado: (nombre: string, extra: Record<string, string>) => Promise<void>;
  deleteEstado: (id: string) => Promise<void>;
};

export default function NuevoEquipoModal({
  isOpen, onClose, onSuccess, categorias, estados,
  addCategoria, deleteCategoria, addEstado, deleteEstado
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSku, setCreatedSku] = useState('');
  const [formData, setFormData] = useState({
    sku: '',
    categoria: '',
    modelo: '',
    estado: '',
    descripcion: '',
  });

  const [showCatEditor, setShowCatEditor] = useState(false);
  const [showEstEditor, setShowEstEditor] = useState(false);

  // Reiniciar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setFormData({
        sku: '',
        categoria: categorias[0]?.nombre ?? '',
        modelo: '',
        estado: estados[0]?.nombre ?? '',
        descripcion: '',
      });
      setShowCatEditor(false);
      setShowEstEditor(false);
    }
  }, [isOpen, categorias, estados]);

  // Auto-SKU
  useEffect(() => {
    const cat = categorias.find(c => c.nombre === formData.categoria);
    if (cat && !showSuccess) {
      const suffix = Math.floor(1000 + Math.random() * 9000).toString();
      setFormData(prev => ({ ...prev, sku: `${cat.prefijo}-${suffix}` }));
    }
  }, [formData.categoria, categorias, showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelo.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('hardware').insert([{
      sku: formData.sku,
      categoria: formData.categoria,
      modelo: formData.modelo,
      estado: formData.estado,
      descripcion: formData.descripcion.trim() || null,
    }]);
    if (!error) {
      setCreatedSku(formData.sku);
      setShowSuccess(true);
      onSuccess();
    } else {
      alert('Error al guardar: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-400 sm:duration-500" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-400 sm:duration-500" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <Dialog.Panel className="pointer-events-auto w-screen sm:max-w-md flex">
                  <div className="flex h-full w-full flex-col bg-white shadow-2xl overflow-hidden">
                    {/* Cabecera */}
                    <div className="px-6 sm:px-8 py-7 border-b border-slate-100 flex items-center justify-between shrink-0">
                      <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 tracking-tight">Registrar Equipo</Dialog.Title>
                      <button onClick={onClose} className="rounded-full p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
                      {showSuccess ? (
                        <div className="flex flex-col items-center text-center py-10 animate-in fade-in duration-500">
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 border-[6px] border-emerald-100 mb-6 shadow-sm">
                            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">¡Guardado con Éxito!</h3>
                          <p className="mt-3 text-slate-500 font-medium leading-relaxed">
                            El equipo <span className="text-slate-900 font-bold">{formData.modelo}</span> ya está registrado en el inventario oficial.
                          </p>
                          <div className="mt-10 flex w-full flex-col gap-3">
                            <button
                              onClick={() => router.push(`/admin/generar-qr?sku=${createdSku}`)}
                              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                            >
                              <QrCode className="h-5 w-5" /> Generar e Imprimir QR
                            </button>
                            <button
                              onClick={() => {
                                setShowSuccess(false);
                                setFormData({ sku: '', modelo: '', descripcion: '', categoria: categorias[0]?.nombre ?? '', estado: estados[0]?.nombre ?? '' });
                              }}
                              className="w-full rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                              Registrar otro equipo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 pb-12">

                          {/* Categoría */}
                          <div className="space-y-1.5 relative">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Categoría <span className="text-red-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => { setShowCatEditor(v => !v); setShowEstEditor(false); }}
                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                <Pencil className="h-3 w-3" /> Personalizar
                              </button>
                            </div>
                            <select
                              value={formData.categoria}
                              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold cursor-pointer"
                            >
                              {categorias.map(c => (
                                <option key={c.id} value={c.nombre}>{c.nombre}</option>
                              ))}
                            </select>
                            {showCatEditor && (
                              <InlineEditor
                                items={categorias}
                                onAdd={addCategoria}
                                onDelete={deleteCategoria}
                                onSelect={(nombre) => setFormData(prev => ({ ...prev, categoria: nombre }))}
                                extraField={{ key: 'prefijo', label: 'Prefijo SKU', type: 'text' }}
                                onClose={() => setShowCatEditor(false)}
                              />
                            )}
                          </div>

                          {/* Estado */}
                          <div className="space-y-1.5 relative">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Estado <span className="text-red-500">*</span>
                              </label>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setShowEstEditor(v => !v); setShowCatEditor(false); }}
                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                <Pencil className="h-3 w-3" /> Personalizar
                              </button>
                            </div>
                            <select
                              value={formData.estado}
                              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold cursor-pointer"
                            >
                              {estados.map(e => (
                                <option key={e.id} value={e.nombre}>{e.nombre}</option>
                              ))}
                            </select>
                            {showEstEditor && (
                              <InlineEditor
                                items={estados}
                                onAdd={addEstado}
                                onDelete={deleteEstado}
                                onSelect={(nombre) => setFormData(prev => ({ ...prev, estado: nombre }))}
                                extraField={{ key: 'color', label: 'Color del badge', type: 'color-pick', options: colorOptions }}
                                onClose={() => setShowEstEditor(false)}
                              />
                            )}
                          </div>

                          {/* Modelo */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Modelo del Equipo <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: Lenovo ThinkPad T14"
                              value={formData.modelo}
                              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-semibold"
                            />
                          </div>

                          {/* SKU */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end mb-1">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Código SKU <span className="text-red-500">*</span>
                              </label>
                              <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-md">Auto-generado</span>
                            </div>
                            <input
                              required
                              type="text"
                              value={formData.sku}
                              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-mono text-slate-700 font-bold tracking-wider"
                            />
                          </div>

                          {/* Descripción (no obligatoria) */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Descripción / Notas
                            </label>
                            <textarea
                              value={formData.descripcion}
                              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                              placeholder="Ej: En mantención por falla en pantalla. Motivo de ingreso a bodega..."
                              rows={3}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all resize-none text-slate-700"
                            />
                            <p className="text-[11px] text-slate-400 px-1">Opcional — detalla el motivo de ingreso, estado de mantención, etc.</p>
                          </div>

                          <div className="pt-6">
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full flex justify-center items-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Plus className="h-5 w-5" /> Guardar Equipo</>}
                            </button>
                          </div>
                        </form>
                      )}
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