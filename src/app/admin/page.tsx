'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, CheckCircle2, MonitorPlay, Wrench, Trash2,
  ArrowRightLeft, AlertTriangle, Info, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { InventoryTransaction } from '@/types';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';

const COLORS_CATEGORIAS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#f97316'  // Orange
];

const COLORS_ESTADOS = {
  'DISPONIBLE': '#10b981',
  'EN_USO': '#3b82f6',
  'EN_MANTENCION': '#f59e0b',
  'DADO_DE_BAJA': '#ef4444'
};

// --- Componentes Skeleton Internos ---
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const KpiSkeleton = () => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 md:p-3 lg:p-5 shadow-sm">
    <div className="flex flex-col items-start gap-3 md:gap-2 lg:gap-3">
      <Skeleton className="h-9 w-9 md:h-7 md:w-7 lg:h-9 lg:w-9 rounded-lg" />
      <div className="w-full space-y-2 md:space-y-1 lg:space-y-2">
        <Skeleton className="h-3 w-20 md:w-16 lg:w-20" />
        <Skeleton className="h-7 w-12 md:h-5 lg:h-7" />
      </div>
    </div>
  </div>
);

const PieSkeleton = () => (
  <div className="flex flex-col items-center gap-5 md:gap-3 lg:gap-5 w-full h-[300px] md:h-[220px] 2xl:h-[300px] justify-center">
    {/* Donut placeholder */}
    <div className="relative flex items-center justify-center">
      <Skeleton className="h-[200px] w-[200px] md:h-[150px] md:w-[150px] lg:h-[200px] lg:w-[200px] rounded-full" />
      <div className="absolute h-[120px] w-[120px] md:h-[90px] md:w-[90px] lg:h-[120px] lg:w-[120px] rounded-full bg-slate-50" />
    </div>
    {/* Legend */}
    <div className="flex flex-wrap justify-center gap-3 md:gap-2 lg:gap-3">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-3 w-16 md:w-12 lg:w-16" />
        </div>
      ))}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isMedium, setIsMedium] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMedium(window.innerWidth >= 768 && window.innerWidth <= 1536);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const [recentTransactions, setRecentTransactions] = useState<InventoryTransaction[]>([]);
  const [distribucionData, setDistribucionData] = useState<any[]>([]);
  const [estadoData, setEstadoData] = useState<any[]>([]);
  const [categoriaData, setCategoriaData] = useState<any[]>([]);
  const [stockCritico, setStockCritico] = useState<any[]>([]);

  const [stats, setStats] = useState([
    { name: 'Total Equipos', value: '0', icon: Box, color: 'text-slate-600', bg: 'bg-slate-50' },
    { name: 'Disponibles', value: '0', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'En Uso', value: '0', icon: MonitorPlay, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'En Mantención', value: '0', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Dados de Baja', value: '0', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'Movimientos Hoy', value: '0', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];

      // 1. Obtener conteos generales y transacciones recientes
      const [
        { count: totalHardware },
        { count: disponibles },
        { count: enUso },
        { count: enReparacion },
        { count: deBaja },
        { count: movsHoyCount },
        { data: ultimasTx },
        { data: categoriasData }
      ] = await Promise.all([
        supabase.from('hardware').select('*', { count: 'estimated', head: true }),
        supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('estado', 'DISPONIBLE'),
        supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('estado', 'EN_USO'),
        supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('estado', 'EN_MANTENCION'),
        supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('estado', 'DADO_DE_BAJA'),
        supabase.from('transacciones').select('*', { count: 'exact', head: true }).gte('timestamp', `${hoy}T00:00:00Z`),
        supabase.from('transacciones').select('*').order('timestamp', { ascending: false }).limit(8),
        supabase.from('categorias').select('nombre')
      ]);

      setStats([
        { name: 'Total Equipos', value: String(totalHardware || 0), icon: Box, color: 'text-slate-600', bg: 'bg-slate-50' },
        { name: 'Disponibles', value: String(disponibles || 0), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { name: 'En Uso', value: String(enUso || 0), icon: MonitorPlay, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'En Mantención', value: String(enReparacion || 0), icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
        { name: 'Dados de Baja', value: String(deBaja || 0), icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
        { name: 'Movimientos Hoy', value: String(movsHoyCount || 0), icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50' },
      ]);

      if (ultimasTx) setRecentTransactions(ultimasTx);

      // 2. Construir datos de categorías dinámicamente SIN descargar todo el hardware
      const categoriasNombres = categoriasData ? categoriasData.map(c => c.nombre) : [];
      categoriasNombres.push(null); // Para items 'Sin Categoría'

      const catPromises = categoriasNombres.map(async (catName) => {
        const catLabel = catName || 'Sin Categoría';

        const qCat = catName
          ? supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('categoria', catName)
          : supabase.from('hardware').select('*', { count: 'estimated', head: true }).is('categoria', null);

        const qDisp = catName
          ? supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('categoria', catName).eq('estado', 'DISPONIBLE')
          : supabase.from('hardware').select('*', { count: 'estimated', head: true }).is('categoria', null).eq('estado', 'DISPONIBLE');

        const qUso = catName
          ? supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('categoria', catName).eq('estado', 'EN_USO')
          : supabase.from('hardware').select('*', { count: 'estimated', head: true }).is('categoria', null).eq('estado', 'EN_USO');

        const qMant = catName
          ? supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('categoria', catName).eq('estado', 'EN_MANTENCION')
          : supabase.from('hardware').select('*', { count: 'estimated', head: true }).is('categoria', null).eq('estado', 'EN_MANTENCION');

        const qBaja = catName
          ? supabase.from('hardware').select('*', { count: 'estimated', head: true }).eq('categoria', catName).eq('estado', 'DADO_DE_BAJA')
          : supabase.from('hardware').select('*', { count: 'estimated', head: true }).is('categoria', null).eq('estado', 'DADO_DE_BAJA');

        const [t, d, u, m, b] = await Promise.all([qCat, qDisp, qUso, qMant, qBaja]);

        return {
          name: catLabel,
          total: t.count || 0,
          DISPONIBLE: d.count || 0,
          EN_USO: u.count || 0,
          EN_MANTENCION: m.count || 0,
          DADO_DE_BAJA: b.count || 0
        };
      });

      const catStatsArray = await Promise.all(catPromises);

      const conteoCategorias: Record<string, number> = {};
      const distribucionCat: Record<string, any> = {};
      const stockPorCategoria: Record<string, { total: number, disponible: number }> = {};

      catStatsArray.forEach(stat => {
        if (stat.total === 0) return; // Ignorar categorías vacías para no ensuciar gráficos

        conteoCategorias[stat.name] = stat.total;
        distribucionCat[stat.name] = {
          name: stat.name,
          DISPONIBLE: stat.DISPONIBLE,
          EN_USO: stat.EN_USO,
          EN_MANTENCION: stat.EN_MANTENCION,
          DADO_DE_BAJA: stat.DADO_DE_BAJA
        };
        stockPorCategoria[stat.name] = { total: stat.total, disponible: stat.DISPONIBLE };
      });

      setEstadoData([
        { name: 'DISPONIBLE', value: disponibles || 0 },
        { name: 'EN_USO', value: enUso || 0 },
        { name: 'EN_MANTENCION', value: enReparacion || 0 },
        { name: 'DADO_DE_BAJA', value: deBaja || 0 }
      ]);

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

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useRealtimeTable({
    table: 'hardware',
    onRefresh: fetchDashboardData
  });

  useRealtimeTable({
    table: 'transacciones',
    onRefresh: fetchDashboardData
  });

  return (
    <div className="space-y-8 md:space-y-4 lg:space-y-8 relative pb-2 min-h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-2xl md:text-xl lg:text-2xl font-bold text-slate-900">Panel de Control de Inventario</h1>
        <p className="text-slate-500 text-sm md:text-xs lg:text-sm">Estado actual de la bodega y equipos desplegados.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:gap-3 lg:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {loading
          ? Array(6).fill(0).map((_, i) => <KpiSkeleton key={i} />)
          : stats.map((stat) => (
            <div key={stat.name} className="rounded-xl border border-slate-200 bg-slate-50 p-5 md:p-3 lg:p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-col items-start gap-3 md:gap-2 lg:gap-3">
                <div className={`rounded-lg p-2 md:p-1.5 lg:p-2 ${stat.bg} w-fit`}>
                  <stat.icon className={`h-5 w-5 md:h-4 md:w-4 lg:h-5 lg:w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs md:text-[10px] lg:text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.name}</p>
                  <p className="text-2xl md:text-xl lg:text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Fila 1 */}
      <div className="grid grid-cols-1 gap-6 md:gap-4 lg:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-6 md:p-4 lg:p-6 shadow-sm min-h-95 md:min-h-64 2xl:min-h-95">
          <h2 className="text-lg md:text-base lg:text-lg font-semibold text-slate-800 mb-4 md:mb-2 lg:mb-4">Distribución de Estados por Categoría</h2>
          <div className="w-full">
            {loading ? (
              <div className="space-y-4 md:space-y-2 lg:space-y-4 w-full h-[300px] md:h-[220px] 2xl:h-[300px] flex flex-col justify-end">
                <Skeleton className="h-full w-full" />
                <div className="flex justify-center gap-4 mt-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-20" /></div>
              </div>
            ) : (
              // En notebooks (md/lg/xl) bajamos un poco la altura del gráfico para que no coma tanta pantalla
              <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1536 ? 220 : 300}>
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

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 md:p-4 lg:p-6 shadow-sm min-h-95 md:min-h-64 2xl:min-h-95">
          <h2 className="text-lg md:text-base lg:text-lg font-semibold text-slate-800 mb-4 md:mb-2 lg:mb-4">Estado General</h2>
          <div className="w-full flex justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-5 pt-4">
                <PieSkeleton />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1536 ? 220 : 300}>
                <PieChart>
                  <Pie
                    data={estadoData}
                    cx="50%" cy="50%"
                    innerRadius={isMedium ? 45 : 60}
                    outerRadius={isMedium ? 75 : 90}
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
      <div className="grid grid-cols-1 gap-6 md:gap-4 lg:gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 md:p-4 lg:p-6 shadow-sm min-h-100 md:min-h-72 2xl:min-h-100">
          <h2 className="text-lg md:text-base lg:text-lg font-semibold text-slate-800 mb-4 md:mb-2 lg:mb-4">Equipos por Categoría</h2>
          <div className="w-full">
            {loading ? (
              <div className="space-y-4 md:space-y-2 lg:space-y-4 w-full h-[350px] md:h-[250px] 2xl:h-[350px] flex flex-col justify-between py-4">
                {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-8 md:h-6 lg:h-8 w-full" />)}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1536 ? 250 : 350}>
                <BarChart data={categoriaData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" name="Cantidad" fill="#1e293b" radius={[0, 4, 4, 0]} barSize={25}>
                    {categoriaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_CATEGORIAS[index % COLORS_CATEGORIAS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 md:p-4 lg:p-6 shadow-sm h-full flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 md:p-2 lg:p-4 opacity-5 pointer-events-none">
            <AlertTriangle className="w-32 h-32 md:w-20 md:h-20 lg:w-32 lg:h-32" />
          </div>
          <div className="flex items-center gap-2 mb-6 md:mb-4 lg:mb-6 relative z-10">
            <AlertTriangle className="h-5 w-5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-red-500" />
            <h2 className="text-lg md:text-base lg:text-lg font-semibold text-slate-800">Alertas de Stock Crítico</h2>
          </div>

          <div className="flex-1 flex flex-col justify-start gap-5 md:gap-3 lg:gap-5 relative z-10">
            {loading ? (
              <div className="space-y-6 md:space-y-4 lg:space-y-6">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2 md:space-y-1 lg:space-y-2">
                    <div className="flex justify-between"><Skeleton className="h-3 md:h-2 lg:h-3 w-24" /><Skeleton className="h-3 md:h-2 lg:h-3 w-16" /></div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : stockCritico.length > 0 ? (
              stockCritico.map(item => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm md:text-xs lg:text-sm mb-2 md:mb-1 lg:mb-2">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className={`font-bold ${item.disponible === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {item.disponible} disponibles
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 md:h-1.5 lg:h-2 overflow-hidden">
                    <div
                      className={`h-2 md:h-1.5 lg:h-2 rounded-full transition-all duration-1000 ease-out ${item.disponible === 0 ? 'bg-red-600' :
                          item.disponible <= 2 ? 'bg-orange-500' :
                            'bg-amber-400'
                        }`}
                      style={{ width: `${Math.max(item.porcentaje, 5)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="h-10 w-10 md:h-8 md:w-8 lg:h-10 lg:w-10 text-emerald-400 mx-auto mb-2 md:mb-1 lg:mb-2 opacity-50" />
                  <p className="text-slate-500 font-medium text-sm md:text-xs lg:text-sm">Inventario Saludable</p>
                  <p className="text-slate-400 text-xs md:text-[10px] lg:text-xs mt-1 md:mt-0.5 lg:mt-1">Ninguna categoría tiene menos de 5 unidades.</p>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 md:pt-3 lg:pt-4 border-t border-slate-100">
              <p className="text-xs md:text-[10px] lg:text-xs text-slate-500 flex items-center gap-1.5 md:gap-1 lg:gap-1.5">
                <Info className="h-4 w-4 md:h-3 md:w-3 lg:h-4 lg:w-4 shrink-0" />
                Se muestran las categorías con menos de 5 equipos listos para ser asignados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}