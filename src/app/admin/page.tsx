'use client';

import { Box, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { name: 'Stock Total', value: '124', icon: Box, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Salidas hoy', value: '12', icon: ArrowUpRight, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Ingresos hoy', value: '8', icon: ArrowDownRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Usuarios Activos', value: '3', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bienvenido, Benjamin</h1>
        <p className="text-slate-500 text-sm">Aquí tienes un resumen de la bodega para hoy.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder para tablas/gráficos futuros */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-300px flex items-center justify-center">
          <p className="text-slate-400 italic text-sm">Próximamente: Gráfico de movimientos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-300px flex items-center justify-center">
          <p className="text-slate-400 italic text-sm">Próximamente: Últimas transacciones</p>
        </div>
      </div>
    </div>
  );
}