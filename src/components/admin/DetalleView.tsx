'use client';

import { ArrowLeft, Layers, MapPin, Tag, FileText, ArrowUpRight, ArrowDownLeft, Trash2, Edit2 } from 'lucide-react';
import { colorDotClasses } from '@/lib/colorMaps';
import { getIconoCategoria } from '@/lib/categoryIcon';
import { HardwareItem } from '@/types';

export type Categoria = { id: string; nombre: string; prefijo: string };
export type Estado = { id: string; nombre: string; color: string };

type DetalleViewProps = {
  item: HardwareItem;
  estados: Estado[];
  categorias: Categoria[];
  onBack: () => void;
  onEdit?: (item: HardwareItem) => void;
  onDelete?: (item: HardwareItem) => void;
  onMoveStock?: (item: HardwareItem, tipo: 'SALIDA' | 'INGRESO') => Promise<void>;
  getBadgeClass: (estado: string) => string;
  backText?: string;
};

export default function DetalleView({ 
  item, 
  estados, 
  categorias, 
  onBack, 
  onEdit, 
  onDelete, 
  onMoveStock, 
  getBadgeClass,
  backText = "Volver al inventario"
}: DetalleViewProps) {

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
        {backText}
      </button>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden">
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
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  <p className="font-mono text-sm text-slate-400 font-bold tracking-widest break-all">
                    SKU: {item.sku}
                  </p>
                  {item.numero_serie && (
                    <>
                      <span className="text-slate-300">•</span>
                      <p className="font-mono text-sm text-slate-500 font-bold tracking-widest break-all">
                        S/N: {item.numero_serie}
                      </p>
                    </>
                  )}
                </div>
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

        <div className="border-t border-slate-100 px-4 sm:px-8 py-4 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 font-mono text-center sm:text-left">
            Última actualización: {formatDate(item.updated_at)}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
            {onMoveStock && (
              <>
                <button
                  onClick={() => onMoveStock(item, 'SALIDA')}
                  disabled={item.estado === 'EN_USO'}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all cursor-pointer disabled:opacity-30"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" /> Retirar
                </button>
                <button
                  onClick={() => onMoveStock(item, 'INGRESO')}
                  disabled={item.estado === 'DISPONIBLE'}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all cursor-pointer disabled:opacity-30"
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" /> Devolver
                </button>
              </>
            )}
            
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(item)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
