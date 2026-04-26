import React from 'react';

/**
 * Componente Skeleton base — una barra gris animada como placeholder de carga.
 * Acepta cualquier className de Tailwind para dimensiones y forma.
 */
export function Sk({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded bg-slate-300 ${className}`} style={style} />;
}

/**
 * Skeleton de fila de filtros — muestra N rectángulos flex-1 que llenan el ancho.
 */
export function SkeletonFilterRow({ count = 5, height = 'h-7' }: { count?: number; height?: string }) {
  return (
    <div className="flex items-center gap-2">
      {[...Array(count)].map((_, i) => (
        <Sk key={i} className={`${height} flex-1 rounded-xl`} />
      ))}
    </div>
  );
}
