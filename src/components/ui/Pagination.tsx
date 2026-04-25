'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  /** Mostrar el contador de registros a la izquierda (default: true) */
  showCount?: boolean;
  /** Controla la alineación cuando showCount es false */
  justify?: 'between' | 'center';
};

/**
 * Paginación minimalista sin fondo — solo botones y contador.
 * Reutilizable en inventario, generar-qr, actividad, escaner, usuarios.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showCount = true,
  justify = 'between',
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
      if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className={`flex items-center py-2 px-1 justify-${justify}`}>
      {showCount && (
        <p className="text-xs text-slate-400 font-medium">
          <span className="font-bold text-slate-700">
            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{' '}
          de <span className="font-bold text-slate-700">{totalItems}</span>
        </p>
      )}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`e-${idx}`} className="w-8 text-center text-slate-300 text-xs">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentPage === p
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
