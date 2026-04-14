'use client';

import { useEffect, useState } from 'react';
import { Box, CheckCircle2, MonitorPlay, Wrench, Trash2, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { InventoryTransaction } from '@/types';

// ACTULIZADO: Los nombres aquí deben coincidir EXACTAMENTE con tu base de datos
const COLORS_ESTADOS = {
  'DISPONIBLE': '#10b981', 
  'EN_USO': '#3b82f6',     
  'EN_MANTENCION': '#f59e0b', // Cambiado de EN_REPARACION
  'DADO_DE_BAJA': '#ef4444'   // Cambiado de DE_BAJA
};
const COLORS_CATEGORIAS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#0ea5e9'];

export default function AdminDashboard() {
  const [recentTransactions, setRecentTransactions] = useState<InventoryTransaction[]>([]);
  // NUEVO: Estado para el gráfico principal cruzado
  const [distribucionData, setDistribucionData] = useState<any[]>([]);
  const [estadoData, setEstadoData] = useState<any[]>([]);
  const [categoriaData, setCategoriaData] = useState<any[]>([]);

  const [stats, setStats] = useState([
    { name: 'Total Equipos', value: '0', icon: Box, color: 'text-slate-600', bg: 'bg-slate-100' },
    { name: 'Disponibles', value: '0', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'En Uso', value: '0', icon: MonitorPlay, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'En Mantención', value: '0', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Dados de Baja', value: '0', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'Movimientos Hoy', value: '0', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]);

  useEffect(() => {
    async function fetchDashboardData() {
      const hoy = new Date().toISOString().split('T')[0];

      const [
        { count: totalHardware },
        { count: disponibles },
        { count: enUso },
        { count: enReparacion },
        { count: deBaja },
        { data: movsHoy },
        { data: ultimasTx },
        { data: allHardware }
      ] = await Promise.all([
        supabase.from('hardware').select('*', { count: 'exact', head: true }),
        supabase.from('hardware').select('*', { count: 'exact', head: true }).eq('estado', 'DISPONIBLE'),
        supabase.from('hardware').select('*', { count: 'exact', head: true }).eq('estado', 'EN_USO'),
        // ACTUALIZADO: Consultas ajustadas a los textos literales de tu BD
        supabase.from('hardware').select('*', { count: 'exact', head: true }).eq('estado', 'EN_MANTENCION'),
        supabase.from('hardware').select('*', { count: 'exact', head: true }).eq('estado', 'DADO_DE_BAJA'),
        supabase.from('transacciones').select('id').gte('timestamp', `${hoy}T00:00:00Z`),
        supabase.from('transacciones').select('*').order('timestamp', { ascending: false }).limit(8),
        supabase.from('hardware').select('estado, categoria')
      ]);

      setStats([
        { name: 'Total Equipos', value: String(totalHardware || 0), icon: Box, color: 'text-slate-600', bg: 'bg-slate-100' },
        { name: 'Disponibles', value: String(disponibles || 0), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { name: 'En Uso', value: String(enUso || 0), icon: MonitorPlay, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'En Mantención', value: String(enReparacion || 0), icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
        { name: 'Dados de Baja', value: String(deBaja || 0), icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
        { name: 'Movimientos Hoy', value: String(movsHoy?.length || 0), icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50' },
      ]);

      if (ultimasTx) setRecentTransactions(ultimasTx);

      if (allHardware) {
        // ACTUALIZADO: Keys coincidentes con la BD
        const conteoEstados = { DISPONIBLE: 0, EN_USO: 0, EN_MANTENCION: 0, DADO_DE_BAJA: 0 };
        const conteoCategorias: Record<string, number> = {};
        const distribucionCat: Record<string, any> = {};

        allHardware.forEach(item => {
          // Llenar datos para la torta
          if (item.estado in conteoEstados) conteoEstados[item.estado as keyof typeof conteoEstados]++;
          
          const cat = item.categoria || 'Sin Categoría';
          
          // Llenar datos para barras de categorías simples
          conteoCategorias[cat] = (conteoCategorias[cat] || 0) + 1;

          // NUEVO: Agrupar datos cruzados para el gráfico principal
          if (!distribucionCat[cat]) {
            distribucionCat[cat] = { name: cat, DISPONIBLE: 0, EN_USO: 0, EN_MANTENCION: 0, DADO_DE_BAJA: 0 };
          }
          if (item.estado in distribucionCat[cat]) {
             distribucionCat[cat][item.estado]++;
          }
        });

        setEstadoData(Object.entries(conteoEstados).map(([name, value]) => ({ name, value })));
        setCategoriaData(Object.entries(conteoCategorias)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
        );
        // Guardar la data estructurada para el nuevo gráfico
        setDistribucionData(Object.values(distribucionCat));
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de Control de Inventario</h1>
        <p className="text-slate-500 text-sm">Estado actual de la bodega y equipos desplegados.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col items-start gap-3">
              <div className={`rounded-lg p-2 ${stat.bg} w-fit`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fila 1: NUEVO Gráfico Apilado y Estado Global */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Distribución de Estados por Categoría</h2>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribucionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {/* Barras Apiladas usando los mismos colores definidos arriba */}
                <Bar dataKey="DISPONIBLE" name="Disponible" stackId="a" fill={COLORS_ESTADOS['DISPONIBLE']} maxBarSize={50} />
                <Bar dataKey="EN_USO" name="En Uso" stackId="a" fill={COLORS_ESTADOS['EN_USO']} maxBarSize={50} />
                <Bar dataKey="EN_MANTENCION" name="En Mantención" stackId="a" fill={COLORS_ESTADOS['EN_MANTENCION']} maxBarSize={50} />
                <Bar dataKey="DADO_DE_BAJA" name="Dado de Baja" stackId="a" fill={COLORS_ESTADOS['DADO_DE_BAJA']} maxBarSize={50} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Estado General</h2>
          <div className="w-full flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={estadoData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={5} 
                  dataKey="value"
                  label={({ name, percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {estadoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_ESTADOS[entry.name as keyof typeof COLORS_ESTADOS] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fila 2: Categorías y Últimas Transacciones */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Equipos por Categoría</h2>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoriaData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Cantidad" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={25}>
                  {categoriaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_CATEGORIAS[index % COLORS_CATEGORIAS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Actividad Reciente</h2>
          <div className="space-y-4 flex-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      <ArrowRightLeft className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">SKU: {tx.sku}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.timestamp).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    tx.tipo === 'INGRESO' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {tx.tipo}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center py-10">
                 <p className="text-slate-400 italic text-sm">No hay transacciones registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}