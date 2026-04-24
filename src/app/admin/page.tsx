'use client';

import { useEffect, useState } from 'react';
import { 
  Box, CheckCircle2, MonitorPlay, Wrench, Trash2, 
  ArrowRightLeft, AlertTriangle, Info 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { InventoryTransaction } from '@/types';

const COLORS_ESTADOS = {
  'DISPONIBLE': '#10b981', 
  'EN_USO': '#3b82f6',     
  'EN_MANTENCION': '#f59e0b',
  'DADO_DE_BAJA': '#ef4444'  
};
const COLORS_CATEGORIAS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#0ea5e9'];

// --- Componentes Skeleton Internos ---
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const KpiSkeleton = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col items-start gap-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="w-full space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-12" />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<InventoryTransaction[]>([]);
  const [distribucionData, setDistribucionData] = useState<any[]>([]);
  const [estadoData, setEstadoData] = useState<any[]>([]);
  const [categoriaData, setCategoriaData] = useState<any[]>([]);
  const [stockCritico, setStockCritico] = useState<any[]>([]);

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
      try {
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
          supabase.from('hardware').select('*', { count: 'estimated', head: true }),
          supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('estado', 'DISPONIBLE'),
          supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('estado', 'EN_USO'),
          supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('estado', 'EN_MANTENCION'),
          supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('estado', 'DADO_DE_BAJA'),
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
          const conteoEstados = { DISPONIBLE: 0, EN_USO: 0, EN_MANTENCION: 0, DADO_DE_BAJA: 0 };
          const conteoCategorias: Record<string, number> = {};
          const distribucionCat: Record<string, any> = {};
          const stockPorCategoria: Record<string, { total: number, disponible: number }> = {};

          allHardware.forEach(item => {
            if (item.estado in conteoEstados) conteoEstados[item.estado as keyof typeof conteoEstados]++;
            const cat = item.categoria || 'Sin Categoría';
            conteoCategorias[cat] = (conteoCategorias[cat] || 0) + 1;
            if (!distribucionCat[cat]) {
              distribucionCat[cat] = { name: cat, DISPONIBLE: 0, EN_USO: 0, EN_MANTENCION: 0, DADO_DE_BAJA: 0 };
            }
            if (item.estado in distribucionCat[cat]) {
               distribucionCat[cat][item.estado]++;
            }
            if (!stockPorCategoria[cat]) {
              stockPorCategoria[cat] = { total: 0, disponible: 0 };
            }
            stockPorCategoria[cat].total++;
            if (item.estado === 'DISPONIBLE') {
              stockPorCategoria[cat].disponible++;
            }
          });

          setEstadoData(Object.entries(conteoEstados).map(([name, value]) => ({ name, value })));
          setCategoriaData(Object.entries(conteoCategorias)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
          );
          setDistribucionData(Object.values(distribucionCat));

          const alertas = Object.entries(stockPorCategoria)
            .map(([name, stats]) => ({
              name,
              disponible: stats.disponible,
              porcentaje: stats.total > 0 ? (stats.disponible / stats.total) * 100 : 0
            }))
            .filter(item => item.disponible < 5)
            .sort((a, b) => a.disponible - b.disponible)
            .slice(0, 4);

          setStockCritico(alertas);
        }
      } finally {
        setLoading(false);
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
        {loading 
          ? Array(6).fill(0).map((_, i) => <KpiSkeleton key={i} />)
          : stats.map((stat) => (
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
          ))
        }
      </div>

      {/* Fila 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-95">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Distribución de Estados por Categoría</h2>
          <div className="w-full">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-62.5 w-full" />
                <div className="flex justify-center gap-4"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-20" /></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distribucionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="DISPONIBLE" name="Disponible" stackId="a" fill={COLORS_ESTADOS['DISPONIBLE']} maxBarSize={50} />
                  <Bar dataKey="EN_USO" name="En Uso" stackId="a" fill={COLORS_ESTADOS['EN_USO']} maxBarSize={50} />
                  <Bar dataKey="EN_MANTENCION" name="En Mantención" stackId="a" fill={COLORS_ESTADOS['EN_MANTENCION']} maxBarSize={50} />
                  <Bar dataKey="DADO_DE_BAJA" name="Dado de Baja" stackId="a" fill={COLORS_ESTADOS['DADO_DE_BAJA']} maxBarSize={50} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-95">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Estado General</h2>
          <div className="w-full flex justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-6">
                <div className="h-44 w-44 rounded-full border-8 border-slate-100 border-t-slate-200 animate-spin" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={estadoData} 
                    cx="50%" cy="50%" 
                    innerRadius={60} outerRadius={90} 
                    paddingAngle={5} 
                    dataKey="value"
                    label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {estadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_ESTADOS[entry.name as keyof typeof COLORS_ESTADOS] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Fila 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Equipos por Categoría</h2>
          <div className="w-full">
            {loading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
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
            )}
          </div>
        </div>

        <div className="rounded-xl border border-red-100 bg-white p-6 shadow-sm h-full flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <AlertTriangle className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-slate-800">Alertas de Stock Crítico</h2>
          </div>
          
          <div className="flex-1 flex flex-col justify-start gap-5 relative z-10">
            {loading ? (
               <div className="space-y-6">
                 {Array(3).fill(0).map((_, i) => (
                   <div key={i} className="space-y-2">
                     <div className="flex justify-between"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-16" /></div>
                     <Skeleton className="h-2 w-full" />
                   </div>
                 ))}
               </div>
            ) : stockCritico.length > 0 ? (
              stockCritico.map(item => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className={`font-bold ${item.disponible === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {item.disponible} disponibles
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${item.disponible === 0 ? 'bg-red-500' : 'bg-orange-400'}`} 
                      style={{ width: `${Math.max(item.porcentaje, 5)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2 opacity-50" />
                  <p className="text-slate-500 font-medium text-sm">Inventario Saludable</p>
                  <p className="text-slate-400 text-xs mt-1">Ninguna categoría tiene menos de 5 unidades.</p>
                </div>
              </div>
            )}
            
            <div className="mt-auto pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="h-4 w-4 shrink-0" /> 
                Se muestran las categorías con menos de 5 equipos listos para ser asignados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}