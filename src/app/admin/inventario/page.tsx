'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';
import { 
  Plus, Search, MoreVertical, 
  Laptop, Monitor, Cpu, HardDrive, Tablet, Package,
  X, Loader2, Keyboard, Check, Trash2, Edit2, AlertTriangle,
  ArrowLeft, Tag, Hash, Layers, FileText, ChevronLeft, ChevronRight,
  MapPin, Pencil
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import NuevoEquipoModal from './NuevoEquipoModal';

// --- Tipos ---
type Categoria = { id: string; nombre: string; prefijo: string };
type Estado = { id: string; nombre: string; color: string };
type Ubicacion = { id: string; nombre: string };
type HardwareItem = {
  id: string;
  sku: string;
  modelo: string;
  categoria: string;
  estado: string;
  ubicacion?: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
};

// --- Helpers de color para badges de estado ---
const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100',
};

const colorDotClasses: Record<string, string> = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-400',
};

// --- Icono por categoría ---
const getIconoCategoria = (nombre: string, size: 'sm' | 'lg' = 'sm') => {
  const cls = size === 'lg' ? 'h-12 w-12' : 'h-4 w-4';
  const n = nombre.toLowerCase();
  if (n.includes('laptop') || n.includes('notebook')) return <Laptop className={cls} />;
  if (n.includes('monitor') || n.includes('pantalla')) return <Monitor className={cls} />;
  if (n.includes('tablet')) return <Tablet className={cls} />;
  if (n.includes('periferico') || n.includes('periférico') || n.includes('teclado') || n.includes('mouse')) return <Keyboard className={cls} />;
  if (n.includes('componente') || n.includes('cpu') || n.includes('ram')) return <Cpu className={cls} />;
  if (n.includes('pc') || n.includes('escritorio')) return <HardDrive className={cls} />;
  return <Package className={cls} />;
};

const ITEMS_PER_PAGE = 15;

// =============================================
// Sub-componente: Editor inline para ubicaciones
// =============================================
type UbicacionEditorProps = {
  items: Ubicacion[];
  onAdd: (nombre: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect: (nombre: string) => void;
  onClose: () => void;
};

function UbicacionEditor({ items, onAdd, onDelete, onSelect, onClose }: UbicacionEditorProps) {
  const [newNombre, setNewNombre] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newNombre.trim()) return;
    setSaving(true);
    await onAdd(newNombre.trim());
    setNewNombre('');
    setSaving(false);
  };

  return (
    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Ubicaciones registradas</p>
      {items.length === 0 && (
        <p className="text-xs text-slate-400 italic px-2 py-1">Sin ubicaciones aún.</p>
      )}
      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 group cursor-pointer"
          onClick={() => { onSelect(item.nombre); onClose(); }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
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
          placeholder="Ej: Pasillo A, Estante 2..."
          value={newNombre}
          onChange={e => setNewNombre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
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
// Sub-componente: Vista detalle estilo producto
// =============================================
type DetalleViewProps = {
  item: HardwareItem;
  estados: Estado[];
  categorias: Categoria[];
  onBack: () => void;
  onEdit: (item: HardwareItem) => void;
  onDelete: (item: HardwareItem) => void;
  getBadgeClass: (estado: string) => string;
};

function DetalleView({ item, estados, categorias, onBack, onEdit, onDelete, getBadgeClass }: DetalleViewProps) {
  const est = estados.find(e => e.nombre === item.estado);
  const dotClass = colorDotClasses[est?.color ?? 'slate'] ?? 'bg-slate-400';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver al inventario
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className={`h-2 w-full ${dotClass}`} />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-slate-100 border-2 border-slate-200 text-slate-500 shadow-inner">
                {getIconoCategoria(item.categoria, 'lg')}
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold border flex items-center gap-1.5 ${getBadgeClass(item.estado)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                {item.estado}
              </span>
            </div>

            <div className="flex-1 space-y-6 min-w-0">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight wrap-break-word">
                  {item.modelo}
                </h2>
                <p className="mt-1.5 font-mono text-sm text-slate-400 font-bold tracking-widest break-all">
                  {item.sku}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Layers className="h-3 w-3" /> Categoría
                  </div>
                  <p className="font-bold text-slate-800">{item.categoria}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <MapPin className="h-3 w-3" /> Ubicación
                  </div>
                  <p className="font-bold text-slate-800">
                    {item.ubicacion || <span className="text-slate-400 italic font-medium">Sin asignar</span>}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Tag className="h-3 w-3" /> Estado actual
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${getBadgeClass(item.estado)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                    {item.estado}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <FileText className="h-3 w-3" /> Registrado
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{formatDate(item.created_at)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <FileText className="h-3 w-3" /> Notas / Descripción
                </div>
                {item.descripcion ? (
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">{item.descripcion}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Sin descripción registrada.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 sm:px-8 py-4 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-slate-400 font-mono">
            Última actualización: {formatDate(item.updated_at)}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(item)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-200"
            >
              <Edit2 className="h-3.5 w-3.5" /> Editar equipo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// Página principal
// =============================================
export default function InventarioPage() {
  const [items, setItems] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [ubicacion, setUbicacion] = useState<Ubicacion[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [detalleItem, setDetalleItem] = useState<HardwareItem | null>(null);

  // FIX MENÚ: usamos un ref para saber si estamos en desktop al momento del click,
  // sin depender de breakpoints CSS que el zoom puede romper.
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [menuIsDesktop, setMenuIsDesktop] = useState(false);

  const [editItem, setEditItem] = useState<HardwareItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    modelo: '', categoria: '', estado: '', sku: '', descripcion: '', ubicacion: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [showUbicacionEditorInEdit, setShowUbicacionEditorInEdit] = useState(false);

  const [deleteItem, setDeleteItem] = useState<HardwareItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategoria, filterEstado]);

  // --- NUEVO: AUTO-ABRIR DETALLE DESDE EL ESCÁNER ---
  useEffect(() => {
    // Solo ejecutamos si ya cargaron los items y estamos en el navegador
    if (items.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const skuToOpen = params.get('sku');
      
      if (skuToOpen) {
        // Buscamos el equipo exacto
        const foundItem = items.find(i => i.sku === skuToOpen);
        if (foundItem) {
          // Lo abrimos como si le hubieran hecho click
          setDetalleItem(foundItem);
          
          // Limpiamos la URL silenciosamente para que no se vuelva a abrir si recargas la página
          window.history.replaceState(null, '', '/admin/inventario');
        }
      }
    }
  }, [items]);

  // Cerrar menú con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpenId(null); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: hw }, { data: cats }, { data: ests }, { data: ubics }] = await Promise.all([
      supabase.from('hardware').select('*').order('updated_at', { ascending: false }),
      supabase.from('categorias').select('*').order('nombre'),
      supabase.from('estados').select('*').order('nombre'),
      supabase.from('ubicacion').select('*').order('nombre'),
    ]);
    if (hw) setItems(hw);
    if (cats) setCategorias(cats);
    if (ests) setEstados(ests);
    if (ubics) setUbicacion(ubics);
    setLoading(false);
  };

  // --- CRUD Categorías, Estados ---
  const addCategoria = async (nombre: string, extra?: Record<string, string>) => {
    // Si extra no existe, intentamos sacar el prefijo del nombre
    const prefijo = (extra?.prefijo?.trim() || nombre.substring(0, 3)).toUpperCase();
    
    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nombre, prefijo }])
      .select()
      .single();

    if (error) {
      console.error("Error al añadir categoría:", error.message);
      return;
    }
    if (data) setCategorias(prev => [...prev, data]);
  };

  const deleteCategoria = async (id: string) => {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (!error) setCategorias(prev => prev.filter(c => c.id !== id));
  };

  const addEstado = async (nombre: string, extra?: Record<string, string>) => {
    const color = extra?.color ?? 'slate';
    
    const { data, error } = await supabase
      .from('estados')
      .insert([{ nombre: nombre.toUpperCase(), color }])
      .select()
      .single();

    if (error) {
      console.error("Error al añadir estado:", error.message);
      return;
    }
    if (data) setEstados(prev => [...prev, data]);
  };

  const deleteEstado = async (id: string) => {
    const { error } = await supabase.from('estados').delete().eq('id', id);
    if (!error) setEstados(prev => prev.filter(e => e.id !== id));
  };

  // --- CRUD Ubicaciones ---
  const addUbicacion = async (nombre: string) => {
    // IMPORTANTE: Asegúrate de que el nombre de la tabla sea 'ubicaciones'
    const { data, error } = await supabase
      .from('ubicacion') 
      .insert([{ nombre }])
      .select()
      .single();

    if (error) {
      console.error("Error al añadir ubicación:", error.message);
      return;
    }
    if (data) setUbicacion(prev => [...prev, data]);
  };

  const deleteUbicacion = async (id: string) => {
    const { error } = await supabase.from('ubicaciones').delete().eq('id', id);
    if (!error) setUbicacion(prev => prev.filter(u => u.id !== id));
  };

  // --- Edición ---
  const openEdit = (item: HardwareItem) => {
    setEditItem(item);
    setEditFormData({
      modelo: item.modelo,
      categoria: item.categoria,
      estado: item.estado,
      sku: item.sku,
      descripcion: item.descripcion ?? '',
      ubicacion: item.ubicacion ?? '',
    });
    setShowUbicacionEditorInEdit(false);
    setMenuOpenId(null);
    setDetalleItem(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setEditLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('hardware').update(editFormData).eq('id', editItem.id);
    
    if (!error) {
      await supabase.from('auditoria_logs').insert([{
        accion: 'EDITAR',
        entidad: 'HARDWARE',
        usuario_id: user?.id,
        detalles: {
          sku: editFormData.sku,
          modelo: editFormData.modelo,
          notas: `Edición de datos. Estado: ${editItem.estado} -> ${editFormData.estado}`
        }
      }]);

      await fetchAll(); 
      setEditItem(null); 
    } else {
      alert('Error al editar: ' + error.message);
    }
    setEditLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('hardware').delete().eq('id', deleteItem.id);

    if (!error) {
      await supabase.from('auditoria_logs').insert([{
        accion: 'ELIMINAR',
        entidad: 'HARDWARE',
        usuario_id: user?.id,
        detalles: {
          sku: deleteItem.sku,
          modelo: deleteItem.modelo,
          notas: `Equipo eliminado definitivamente del inventario`
        }
      }]);

      await fetchAll();
      setDeleteItem(null);
      setDetalleItem(null);
    }
    setDeleteLoading(false);
  };

  const getBadgeClass = (estadoNombre: string) => {
    const est = estados.find(e => e.nombre === estadoNombre);
    return colorClasses[est?.color ?? 'slate'] ?? colorClasses.slate;
  };

  const filteredItems = items.filter(item => {
    const matchSearch =
      item.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !filterCategoria || item.categoria === filterCategoria;
    const matchEst = !filterEstado || item.estado === filterEstado;
    return matchSearch && matchCat && matchEst;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // FIX: Función de posición del menú que NO usa window.innerWidth
  // para calcular `right`, ya que con zoom esa medida es incorrecta.
  // En cambio usamos getBoundingClientRect() directamente.
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, itemId: string) => {
    e.stopPropagation();
    if (menuOpenId === itemId) { setMenuOpenId(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const menuHeight = 110;
    const spaceBelow = window.innerHeight - r.bottom;
    setMenuPos({
      top: spaceBelow < (menuHeight + 20)
        ? r.top + window.scrollY - menuHeight - 8
        : r.bottom + window.scrollY + 4,
      // FIX: Calculamos `right` desde el borde derecho del botón al borde derecho del viewport
      // usando documentElement.clientWidth (no se ve afectado por zoom CSS)
      right: document.documentElement.clientWidth - r.right,
    });
    setMenuOpenId(itemId);
  };

  if (detalleItem) {
    return (
      <div className="space-y-6">
        <DetalleView
          item={detalleItem}
          estados={estados}
          categorias={categorias}
          onBack={() => setDetalleItem(null)}
          onEdit={openEdit}
          onDelete={(item) => { setDeleteItem(item); }}
          getBadgeClass={getBadgeClass}
        />

        <Transition show={!!deleteItem} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setDeleteItem(null)}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-slate-900/60 transition-opacity" />
            </Transition.Child>
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-6 pb-8 pt-6 text-left shadow-2xl sm:w-full sm:max-w-sm sm:p-8 border border-slate-100">
                    <div className="absolute right-5 top-5">
                      <button type="button" onClick={() => setDeleteItem(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100"><AlertTriangle className="h-7 w-7" /></div>
                      <div>
                        <Dialog.Title as="h3" className="text-xl font-bold text-slate-950">¿Eliminar equipo?</Dialog.Title>
                        <p className="mt-2.5 text-sm text-slate-500 font-medium">Estás a punto de eliminar <span className="font-bold text-slate-800">{deleteItem?.modelo}</span> ({deleteItem?.sku}). Esta acción no se puede deshacer.</p>
                      </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-3">
                      <button type="button" onClick={handleDelete} disabled={deleteLoading} className="w-full flex justify-center items-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50">
                        {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Sí, eliminar</>}
                      </button>
                      <button type="button" onClick={() => setDeleteItem(null)} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">Cancelar</button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative overflow-x-hidden">
      {/* FIX: overflow-x-hidden en el wrapper de la página */}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario de Hardware</h1>
          <p className="text-sm text-slate-500">Gestiona y registra los activos tecnológicos de la bodega.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Nuevo Equipo
        </button>
      </div>

        {/* =========================================================
          BARRA DE BÚSQUEDA Y FILTROS
          ========================================================= */}
      <div className="space-y-3">
        
        {/* 1. Búsqueda */}
        <div className="relative w-full sm:max-w-sm min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por SKU, Modelo o Ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
          />
        </div>

        {/* 2. Filtros de categoría — flex-wrap para que bajen en vez de ir al lado */}
        <div className="flex items-center gap-2 flex-wrap pb-1">
          <button
            onClick={() => setFilterCategoria('')}
            className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              !filterCategoria
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Todas
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategoria(filterCategoria === cat.nombre ? '' : cat.nombre)}
              className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                filterCategoria === cat.nombre
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* 3. Filtros de estado */}
        {estados.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">Estado:</span>
            
            {/* Mapeo correcto de los botones de color */}
            {estados.map(est => {
              const dot = colorDotClasses[est.color] ?? 'bg-slate-400';
              const badge = colorClasses[est.color] ?? colorClasses.slate;
              const active = filterEstado === est.nombre;
              
              return (
                <button
                  key={est.id}
                  onClick={() => setFilterEstado(active ? '' : est.nombre)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    active ? `${badge} ring-2 ring-offset-1 ring-current` : `${badge} opacity-60 hover:opacity-100`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
                  {est.nombre}
                </button>
              );
            })}

            {/* Botón de limpiar SEPARADO del map */}
            {filterEstado && (
              <button
                onClick={() => setFilterEstado('')}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabla y Vistas Responsivas */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Vista Móvil */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-3" />
              Cargando inventario...
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400">No se encontraron equipos</div>
          ) : (
            paginatedItems.map((item) => (
              <div
                key={`mobile-${item.id}`}
                className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  setDetalleItem(item);
                }}
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* FIX: min-w-0 en el contenedor flex del texto */}
                    <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600 shrink-0">
                      {getIconoCategoria(item.categoria)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-900 truncate leading-tight">
                        {item.modelo}
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.sku}
                        </span>
                        {item.ubicacion && (
                          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3 shrink-0" /> {item.ubicacion}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => openMenu(e, item.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pl-13">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${getBadgeClass(item.estado)}`}>
                    {item.estado}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.categoria}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vista Escritorio */}
        <div className="hidden md:block w-full overflow-x-auto min-w-0">
          <table className="w-full text-left text-sm table-fixed min-w-800px">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 text-slate-900">Equipo / Modelo</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin mb-3 text-slate-400" />
                    Cargando inventario...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400">No se encontraron equipos</td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={`desktop-${item.id}`}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      setDetalleItem(item);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                          {getIconoCategoria(item.categoria)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{item.modelo}</span>
                          {item.descripcion && (
                            <span className="text-[11px] text-slate-400 truncate max-w-50">{item.descripcion}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.sku}</td>
                    <td className="px-6 py-4 text-slate-600">{item.categoria}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                      {item.ubicacion ? (
                        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-400 shrink-0"/> {item.ubicacion}</span>
                      ) : (
                        <span className="text-slate-300 italic font-normal">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${getBadgeClass(item.estado)}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => openMenu(e, item.id)}
                        className="rounded-lg p-2 hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && filteredItems.length > ITEMS_PER_PAGE && (
          <div className="border-t border-slate-100 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
              Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> de <span className="font-bold text-slate-700">{filteredItems.length}</span> equipos
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p); return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">…</span>
                  ) : (
                    <button key={p} onClick={() => setCurrentPage(p as number)} className={`min-w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                      {p}
                    </button>
                  )
                )}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nuevo Equipo */}
      <NuevoEquipoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchAll();
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
        }}
        categorias={categorias}
        estados={estados}
        ubicaciones={ubicacion}
        addCategoria={addCategoria}
        deleteCategoria={deleteCategoria}
        addEstado={addEstado}
        deleteEstado={deleteEstado}
        addUbicacion={addUbicacion}
        deleteUbicacion={deleteUbicacion}
      />

      {/* =========================================================
          PORTAL: Menú Dropdown / Drawer Móvil
          FIX: Unificamos el cálculo de posición usando openMenu()
          que usa document.documentElement.clientWidth en vez de
          window.innerWidth, lo cual no se ve afectado por zoom CSS.
          ========================================================= */}
      {typeof document !== 'undefined' && createPortal(
        <Transition show={!!menuOpenId} as={Fragment}>
          <div className="fixed inset-0 z-50 pointer-events-none">

            {/* Overlay */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                className="absolute inset-0 pointer-events-auto"
                style={{ background: menuIsDesktop ? 'transparent' : 'rgba(15,23,42,0.4)' }}
                onClick={() => setMenuOpenId(null)}
              />
            </Transition.Child>

            {/* Menú — condicional: drawer móvil o dropdown desktop */}
            <Transition.Child
              as={Fragment}
              enter={menuIsDesktop ? "ease-out duration-150" : "ease-out duration-300"}
              enterFrom={menuIsDesktop ? "opacity-0 scale-95" : "translate-y-full opacity-0"}
              enterTo={menuIsDesktop ? "opacity-100 scale-100" : "translate-y-0 opacity-100"}
              leave={menuIsDesktop ? "ease-in duration-100" : "ease-in duration-200"}
              leaveFrom={menuIsDesktop ? "opacity-100 scale-100" : "translate-y-0 opacity-100"}
              leaveTo={menuIsDesktop ? "opacity-0 scale-95" : "translate-y-full opacity-0"}
            >
              {menuIsDesktop ? (
                /* Dropdown desktop */
                <div
                  className="absolute bg-white shadow-xl overflow-hidden pointer-events-auto w-44 rounded-2xl border border-slate-200 py-1.5"
                  style={{ top: menuPos.top, right: menuPos.right }}
                >
                  <button
                    onClick={() => {
                      const item = items.find(i => i.id === menuOpenId);
                      if (item) openEdit(item);
                      setMenuOpenId(null);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Edit2 className="h-4 w-4 text-slate-400" /> Editar equipo
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      const item = items.find(i => i.id === menuOpenId);
                      if (item) { setDeleteItem(item); setMenuOpenId(null); }
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                </div>
              ) : (
                /* Drawer móvil */
                <div className="absolute bottom-0 left-0 right-0 bg-white shadow-2xl overflow-hidden pointer-events-auto rounded-t-3xl border-t border-slate-200 pb-safe">
                  {/* Pill visual */}
                  <div className="mx-auto mt-3 mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
                  <div className="px-4 pb-6 space-y-1">
                    <button
                      onClick={() => {
                        const item = items.find(i => i.id === menuOpenId);
                        if (item) openEdit(item);
                        setMenuOpenId(null);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors rounded-2xl"
                    >
                      <Edit2 className="h-5 w-5 text-slate-400" /> Editar equipo
                    </button>
                    <button
                      onClick={() => {
                        const item = items.find(i => i.id === menuOpenId);
                        if (item) { setDeleteItem(item); setMenuOpenId(null); }
                      }}
                      className="flex w-full items-center gap-3 px-4 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors rounded-2xl"
                    >
                      <Trash2 className="h-5 w-5" /> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </Transition.Child>
          </div>
        </Transition>,
        document.body
      )}

      {/* Modal Editar */}
      <Transition show={!!editItem} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setEditItem(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/60 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95">
                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-6 pb-8 pt-6 text-left shadow-2xl sm:my-8 sm:w-full sm:max-w-md sm:p-8 border border-slate-100">
                  <div className="absolute right-5 top-5">
                    <button type="button" onClick={() => setEditItem(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="flex flex-col items-center text-center gap-4 mb-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100"><Edit2 className="h-7 w-7" /></div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-950 tracking-tight">Editar Equipo</Dialog.Title>
                      <p className="mt-2.5 text-sm text-slate-500 font-medium">Modifica los datos del activo registrado.</p>
                    </div>
                  </div>
                  <form onSubmit={handleEdit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Modelo <span className="text-red-500">*</span>
                      </label>
                      <input required type="text" value={editFormData.modelo} onChange={e => setEditFormData({ ...editFormData, modelo: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Categoría <span className="text-red-500">*</span>
                        </label>
                        <select value={editFormData.categoria} onChange={e => setEditFormData({ ...editFormData, categoria: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold cursor-pointer">
                          {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Estado <span className="text-red-500">*</span>
                        </label>
                        <select value={editFormData.estado} onChange={e => setEditFormData({ ...editFormData, estado: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold cursor-pointer">
                          {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Ubicación editable en modal editar */}
                    <div className="space-y-1.5 relative">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <MapPin className="h-3 w-3" /> Ubicación / Estante
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowUbicacionEditorInEdit(v => !v)}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-all cursor-pointer"
                        >
                          <Pencil className="h-3 w-3" /> Gestionar
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={editFormData.ubicacion}
                          onChange={e => setEditFormData({ ...editFormData, ubicacion: e.target.value })}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold cursor-pointer"
                        >
                          <option value="">Sin asignar</option>
                          {ubicacion.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
                        </select>
                      </div>
                      {showUbicacionEditorInEdit && (
                        <UbicacionEditor
                          items={ubicacion}
                          onAdd={addUbicacion}
                          onDelete={deleteUbicacion}
                          onSelect={(nombre) => setEditFormData(prev => ({ ...prev, ubicacion: nombre }))}
                          onClose={() => setShowUbicacionEditorInEdit(false)}
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <input required type="text" value={editFormData.sku} onChange={e => setEditFormData({ ...editFormData, sku: e.target.value.toUpperCase() })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-mono font-bold tracking-wider" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Descripción</label>
                      <textarea
                        value={editFormData.descripcion}
                        onChange={e => setEditFormData({ ...editFormData, descripcion: e.target.value })}
                        placeholder="Ej: En mantención por falla en batería. Entregado el 10/01..."
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all resize-none text-slate-700"
                      />
                    </div>
                    <div className="mt-8 flex flex-col gap-3 pt-2">
                      <button type="submit" disabled={editLoading} className="w-full flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50">
                        {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Guardar cambios</>}
                      </button>
                      <button type="button" onClick={() => setEditItem(null)} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">Cancelar</button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Borrado */}
      <Transition show={!!deleteItem} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteItem(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/60 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-6 pb-8 pt-6 text-left shadow-2xl sm:my-8 sm:w-full sm:max-w-sm sm:p-8 border border-slate-100">
                  <div className="absolute right-5 top-5">
                    <button type="button" onClick={() => setDeleteItem(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100"><AlertTriangle className="h-7 w-7" /></div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-bold text-slate-950">¿Eliminar equipo?</Dialog.Title>
                      <p className="mt-2.5 text-sm text-slate-500 font-medium">Estás a punto de eliminar <span className="font-bold text-slate-800">{deleteItem?.modelo}</span> ({deleteItem?.sku}). Esta acción no se puede deshacer.</p>
                    </div>
                  </div>
                  <div className="mt-8 flex flex-col gap-3">
                    <button type="button" onClick={handleDelete} disabled={deleteLoading} className="w-full flex justify-center items-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50">
                      {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Sí, eliminar</>}
                    </button>
                    <button type="button" onClick={() => setDeleteItem(null)} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">Cancelar</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Toast de éxito */}
      <Transition
        show={showSuccessToast}
        as={Fragment}
        enter="transition ease-out duration-300 transform"
        enterFrom="opacity-0 translate-y-10 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-200 transform"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-10 scale-95"
      >
        <div className="fixed bottom-0 left-0 right-0 z-100 p-6 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-white px-6 py-3.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-emerald-100">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-slate-800 leading-tight">Listo, equipo registrado</p>
              <p className="text-[11px] text-slate-400 font-medium">El inventario se ha actualizado correctamente</p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}