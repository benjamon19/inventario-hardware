'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  Plus, Search, Filter, MoreVertical, 
  Laptop, Monitor, Cpu, HardDrive, X, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { currentTheme } from '@/config/theme';

export default function InventarioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para el formulario de nuevo equipo
  const [formData, setFormData] = useState({
    sku: '',
    categoria: 'Laptop',
    modelo: '',
    estado: 'DISPONIBLE'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hardware')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (!error) setItems(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('hardware')
      .insert([formData]);

    if (!error) {
      setIsModalOpen(false);
      setFormData({ sku: '', categoria: 'Laptop', modelo: '', estado: 'DISPONIBLE' });
      fetchInventory();
    } else {
      alert("Error al guardar: " + error.message);
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item => 
    item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header de la página */}
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

      {/* Barra de Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU o Modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Equipo / Modelo</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
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
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          {item.categoria === 'Laptop' ? <Laptop className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                        </div>
                        <span className="font-semibold text-slate-900">{item.modelo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.sku}</td>
                    <td className="px-6 py-4 text-slate-600">{item.categoria}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                        item.estado === 'DISPONIBLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-600">
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

      {/* --- MODAL PARA AGREGAR EQUIPO (Headless UI) --- */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={() => setIsModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all border border-slate-100">
                  <div className="mb-6 flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-xl font-bold text-slate-900">Registrar Nuevo Equipo</Dialog.Title>
                    <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 hover:bg-slate-100 cursor-pointer text-slate-400 transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Modelo del Equipo</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Ej: ThinkPad T14 G3"
                        value={formData.modelo}
                        onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">SKU / Número de Serie</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Ej: SER-123456"
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</label>
                        <select 
                          value={formData.categoria}
                          onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                        >
                          <option value="Laptop">Laptop</option>
                          <option value="Monitor">Monitor</option>
                          <option value="Periferico">Periférico</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Estado Inicial</label>
                        <select 
                          value={formData.estado}
                          onChange={(e) => setFormData({...formData, estado: e.target.value})}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                        >
                          <option value="DISPONIBLE">Disponible</option>
                          <option value="EN_USO">En Uso</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-4 w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Guardar Equipo"}
                    </button>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}