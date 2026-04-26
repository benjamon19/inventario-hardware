/**
 * Mapas de clases de colores para estados — compartidos entre inventario y generar-qr.
 */

export const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-slate-100 text-slate-900 border-slate-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100',
};

export const colorDotClasses: Record<string, string> = {
  emerald: 'bg-emerald-500',
  blue: 'bg-slate-900',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-400',
};
