'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { 
  Plus, Search, MoreVertical, 
  Laptop, Monitor, Cpu, HardDrive, Tablet, Package,
  X, Loader2, CheckCircle2, QrCode, Keyboard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function InventarioPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados del Panel Lateral
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSku, setCreatedSku] = useState('');
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    sku: '',
    categoria: 'Laptop',
    modelo: '',
    estado: 'DISPONIBLE'
  });

  // Lógica para auto-generar el SKU
  const [isManualSku, setIsManualSku] = useState(false);
  const [randomSuffix, setRandomSuffix] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (!isManualSku && formData.modelo.length > 0) {
      const prefix = formData.categoria.substring(0, 3).toUpperCase();
      const modelWord = formData.modelo.trim().split(' ')[0].substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      if (modelWord) {
        setFormData(prev => ({ ...prev, sku: `${prefix}-${modelWord}-${randomSuffix}` }));
      }
    } else if (!isManualSku && formData.modelo.length === 0) {
      setFormData(prev => ({ ...prev, sku: '' }));
    }
  }, [formData.modelo, formData.categoria, randomSuffix, isManualSku]);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hardware')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (!error) setItems(data);
    setLoading(false);
  };

  const openModal = () => {
    setRandomSuffix(Math.floor(1000 + Math.random() * 9000).toString());
    setIsManualSku(false);
    setShowSuccess(false);
    setFormData({ sku: '', categoria: 'Laptop', modelo: '', estado: 'DISPONIBLE' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('hardware')
      .insert([formData]);

    if (!error) {
      setCreatedSku(formData.sku);
      setShowSuccess(true);
      fetchInventory();
    } else {
      alert("Error al guardar: " + error.message);
    }
    setLoading(false);
  };

  const getIconoCategoria = (categoria: string) => {
    switch (categoria) {
      case 'Laptop': return <Laptop className="h-4 w-4" />;
      case 'PC Escritorio': return <HardDrive className="h-4 w-4" />;
      case 'Monitor': return <Monitor className="h-4 w-4" />;
      case 'Tablet': return <Tablet className="h-4 w-4" />;
      case 'Periferico': return <Keyboard className="h-4 w-4" />;
      case 'Componente': return <Cpu className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
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
          onClick={openModal}
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
                          {getIconoCategoria(item.categoria)}
                        </div>
                        <span className="font-semibold text-slate-900">{item.modelo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.sku}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        {item.categoria}
                      </span>
                    </td>
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

      {/* --- PANEL LATERAL (SLIDE-OVER) FLUIDO --- */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          
          {/* Fondo oscuro (fade) */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              {/* Contenedor alineado a la derecha */}
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                
                {/* Animación de deslizamiento suave (despliegue) */}
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-400 sm:duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-400 sm:duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md flex">
                    
                    {/* Tarjeta principal del panel (Bordes redondeados a la izquierda) */}
                    <div className="flex h-full w-full flex-col bg-white shadow-2xl overflow-hidden">
                      
                      {/* Cabecera Fija */}
                      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md">
                        <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 tracking-tight">
                          Registrar Equipo
                        </Dialog.Title>
                        <button 
                          onClick={() => setIsModalOpen(false)} 
                          className="rounded-full p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {/* Área de Formulario con Scroll */}
                      <div className="flex-1 overflow-y-auto px-8 py-6">
                        {showSuccess ? (
                          <div className="flex flex-col items-center text-center py-10 animate-in fade-in duration-500">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 border-[6px] border-emerald-100 mb-6 shadow-sm">
                              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">¡Equipo Guardado!</h3>
                            <p className="mt-3 text-slate-500 font-medium leading-relaxed">
                              El equipo <span className="text-slate-900 font-bold">{formData.modelo}</span> ya es parte del inventario oficial.
                            </p>
                            
                            <div className="mt-10 flex w-full flex-col gap-3">
                              <button
                                onClick={() => router.push(`/admin/generar-qr?sku=${createdSku}`)}
                                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer"
                              >
                                <QrCode className="h-5 w-5" />
                                Generar e Imprimir QR
                              </button>
                              
                              <button
                                onClick={openModal}
                                className="w-full rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                              >
                                Registrar otro equipo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmit} className="space-y-5 pb-8">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</label>
                                <select 
                                  value={formData.categoria}
                                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700 cursor-pointer"
                                >
                                  <option value="Laptop">Laptop</option>
                                  <option value="PC Escritorio">PC Escritorio</option>
                                  <option value="Monitor">Monitor</option>
                                  <option value="Tablet">Tablet</option>
                                  <option value="Periferico">Periférico</option>
                                  <option value="Componente">Componente</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Estado</label>
                                <select 
                                  value={formData.estado}
                                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700 cursor-pointer"
                                >
                                  <option value="DISPONIBLE">Disponible</option>
                                  <option value="EN_USO">En Uso</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Modelo del Equipo</label>
                              <input 
                                required 
                                type="text" 
                                placeholder="Ej: Lenovo ThinkPad T14"
                                value={formData.modelo}
                                onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-semibold shadow-sm"
                              />
                            </div>

                            <div className="space-y-1.5 pt-2">
                              <div className="flex justify-between items-end mb-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Código SKU</label>
                                {!isManualSku && formData.modelo && (
                                  <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-md">Autogenerado</span>
                                )}
                              </div>
                              <input 
                                required 
                                type="text" 
                                placeholder="Ej: LAP-LENOVO-8492"
                                value={formData.sku}
                                onChange={(e) => {
                                  setIsManualSku(true);
                                  setFormData({...formData, sku: e.target.value.toUpperCase()});
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-mono text-slate-700 font-bold tracking-wider shadow-sm"
                              />
                              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                                El SKU será la placa patente única para identificar este equipo en el escáner.
                              </p>
                            </div>

                            <div className="pt-6">
                              <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Plus className="h-5 w-5"/> Guardar Equipo</>}
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
    </div>
  );
}