'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, MoreVertical, 
  Laptop, Monitor, Cpu, HardDrive, Tablet, Package,
  X, Loader2, Keyboard, Check, Trash2, Edit2, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import NuevoEquipoModal from './NuevoEquipoModal'; // Asegúrate que la ruta sea correcta

// --- Tipos ---
type Categoria = { id: string; nombre: string; prefijo: string };
type Estado = { id: string; nombre: string; color: string };

// --- Helpers de color para badges de estado ---
const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100',
};

// --- Icono por categoría (fallback) ---
const getIconoCategoria = (nombre: string) => {
  const n = nombre.toLowerCase();
  if (n.includes('laptop') || n.includes('notebook')) return <Laptop className="h-4 w-4" />;
  if (n.includes('monitor') || n.includes('pantalla')) return <Monitor className="h-4 w-4" />;
  if (n.includes('tablet')) return <Tablet className="h-4 w-4" />;
  if (n.includes('periferico') || n.includes('periférico') || n.includes('teclado') || n.includes('mouse')) return <Keyboard className="h-4 w-4" />;
  if (n.includes('componente') || n.includes('cpu') || n.includes('ram')) return <Cpu className="h-4 w-4" />;
  if (n.includes('pc') || n.includes('escritorio')) return <HardDrive className="h-4 w-4" />;
  return <Package className="h-4 w-4" />;
};

export default function InventarioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Categorías y estados dinámicos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);

  // Modal de Nuevo Equipo
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Menú de acciones (3 puntos)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Modal de edición
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ modelo: '', categoria: '', estado: '', sku: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Modal de confirmación de borrado
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: hw }, { data: cats }, { data: ests }] = await Promise.all([
      supabase.from('hardware').select('*').order('updated_at', { ascending: false }),
      supabase.from('categorias').select('*').order('nombre'),
      supabase.from('estados').select('*').order('nombre'),
    ]);
    if (hw) setItems(hw);
    if (cats) setCategorias(cats);
    if (ests) setEstados(ests);
    setLoading(false);
  };

  // Funciones que pasaremos al sub-componente
  const addCategoria = async (nombre: string, extra: Record<string, string>) => {
    const prefijo = (extra.prefijo?.trim() || nombre.substring(0, 3)).toUpperCase();
    const { data } = await supabase.from('categorias').insert([{ nombre, prefijo }]).select().single();
    if (data) setCategorias(prev => [...prev, data]);
  };
  const deleteCategoria = async (id: string) => {
    await supabase.from('categorias').delete().eq('id', id);
    setCategorias(prev => prev.filter(c => c.id !== id));
  };
  const addEstado = async (nombre: string, extra: Record<string, string>) => {
    const color = extra.color ?? 'slate';
    const { data } = await supabase.from('estados').insert([{ nombre: nombre.toUpperCase(), color }]).select().single();
    if (data) setEstados(prev => [...prev, data]);
  };
  const deleteEstado = async (id: string) => {
    await supabase.from('estados').delete().eq('id', id);
    setEstados(prev => prev.filter(e => e.id !== id));
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setEditFormData({ modelo: item.modelo, categoria: item.categoria, estado: item.estado, sku: item.sku });
    setMenuOpenId(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setEditLoading(true);
    const { error } = await supabase.from('hardware').update(editFormData).eq('id', editItem.id);
    if (!error) { fetchAll(); setEditItem(null); }
    else alert('Error al editar: ' + error.message);
    setEditLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    await supabase.from('hardware').delete().eq('id', deleteItem.id);
    fetchAll();
    setDeleteItem(null);
    setDeleteLoading(false);
  };

  const filteredItems = items.filter(item =>
    item.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBadgeClass = (estadoNombre: string) => {
    const est = estados.find(e => e.nombre === estadoNombre);
    return colorClasses[est?.color ?? 'slate'] ?? colorClasses.slate;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario de Hardware</h1>
          <p className="text-sm text-slate-500">Gestiona y registra los activos tecnológicos de la bodega.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Nuevo Equipo
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por SKU o Modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
      </div>

      {/* Tabla */}
      <div className="max-w-[calc(100vw-2rem)] sm:max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 text-slate-900">Equipo / Modelo</th>
                <th className="px-6 py-4 hidden sm:table-cell">SKU</th>
                <th className="px-6 py-4 hidden md:table-cell">Categoría</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin mb-3 text-slate-400" />
                    Cargando inventario...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400">No se encontraron equipos</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                          {getIconoCategoria(item.categoria)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{item.modelo}</span>
                          <span className="text-[10px] font-mono text-slate-400 sm:hidden">{item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 hidden sm:table-cell">{item.sku}</td>
                    <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{item.categoria}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${getBadgeClass(item.estado)}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        ref={el => { btnRefs.current[item.id] = el; }}
                        onClick={() => {
                          if (menuOpenId === item.id) { setMenuOpenId(null); return; }
                          const btn = btnRefs.current[item.id];
                          if (btn) {
                            const r = btn.getBoundingClientRect();
                            setMenuPos({ top: r.bottom + window.scrollY + 4, right: window.innerWidth - r.right });
                          }
                          setMenuOpenId(item.id);
                        }}
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
      </div>

      {/* --- EL COMPONENTE SEPARADO --- */}
      <NuevoEquipoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAll}
        categorias={categorias}
        estados={estados}
        addCategoria={addCategoria}
        deleteCategoria={deleteCategoria}
        addEstado={addEstado}
        deleteEstado={deleteEstado}
      />

      {/* --- DROPDOWN PORTAL --- */}
      {menuOpenId && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
          <div
            className="fixed z-50 w-44 rounded-2xl border border-slate-200 bg-white shadow-xl py-1.5 overflow-hidden"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              onClick={() => { const item = items.find(i => i.id === menuOpenId); if (item) openEdit(item); setMenuOpenId(null); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <Edit2 className="h-4 w-4 text-slate-400" /> Editar equipo
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => { const item = items.find(i => i.id === menuOpenId); if (item) { setDeleteItem(item); setMenuOpenId(null); } }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          </div>
        </>,
        document.body
      )}

      {/* --- MODAL EDITAR --- */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setEditItem(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Editar Equipo</h3>
              <button onClick={() => setEditItem(null)} className="rounded-full p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Modelo</label>
                <input
                  required type="text"
                  value={editFormData.modelo}
                  onChange={e => setEditFormData({ ...editFormData, modelo: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</label>
                  <select
                    value={editFormData.categoria}
                    onChange={e => setEditFormData({ ...editFormData, categoria: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold cursor-pointer"
                  >
                    {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Estado</label>
                  <select
                    value={editFormData.estado}
                    onChange={e => setEditFormData({ ...editFormData, estado: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold cursor-pointer"
                  >
                    {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">SKU</label>
                <input
                  required type="text"
                  value={editFormData.sku}
                  onChange={e => setEditFormData({ ...editFormData, sku: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-mono font-bold tracking-wider"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditItem(null)} className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={editLoading} className="flex-1 flex justify-center items-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50 transition-all">
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIRMAR BORRADO --- */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDeleteItem(null)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border-4 border-red-100 mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">¿Eliminar equipo?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Estás a punto de eliminar <span className="font-bold text-slate-800">{deleteItem.modelo}</span> ({deleteItem.sku}). Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteItem(null)} className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 flex justify-center items-center gap-2 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 cursor-pointer disabled:opacity-50 transition-all">
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}