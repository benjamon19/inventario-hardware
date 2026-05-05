'use client';

import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Transition } from '@headlessui/react';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

type HardwareItem = {
  id: string;
  sku: string;
  modelo: string;
  categoria: string;
  estado: string;
  ubicacion?: string;
  descripcion?: string;
  numero_serie?: string;
};

type AccionesMenuProps = {
  menuOpenId: string | null;
  items: HardwareItem[];
  onClose: () => void;
  onEdit: (item: HardwareItem) => void;
  onDelete: (item: HardwareItem) => void;
  onMoveStock: (item: HardwareItem, tipo: 'SALIDA' | 'INGRESO') => Promise<void>;
};

export default function AccionesMenu({
  menuOpenId,
  items,
  onClose,
  onEdit,
  onDelete,
  onMoveStock
}: AccionesMenuProps) {
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (menuOpenId) {
      setSavedId(menuOpenId);
    }
  }, [menuOpenId]);

  if (typeof document === 'undefined') return null;

  const currentId = menuOpenId || savedId;
  const item = items.find(i => i.id === currentId);

  const canRetirar = item?.estado !== 'EN_USO';
  const canDevolver = item?.estado !== 'DISPONIBLE';

  const handleDelayedAction = (action: () => void) => {
    action();
    setTimeout(() => {
      onClose();
    }, 150);
  };

  return createPortal(
    <Transition show={!!menuOpenId} as={Fragment}>
      <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className={`absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] ${menuOpenId ? 'pointer-events-auto' : 'pointer-events-none'}`}
            onClick={onClose}
          />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-300 transform"
          enterFrom="translate-y-full"
          enterTo="translate-y-0"
          leave="transition ease-in duration-200 transform"
          leaveFrom="translate-y-0"
          leaveTo="translate-y-full"
        >
          <div className={`relative w-full max-w-[320px] md:max-w-[380px] [@media(min-width:1350px)_and_(min-height:800px)]:max-w-[480px] bg-white shadow-[0_-10px_40px_rgba(15,23,42,0.1)] rounded-t-4xl border-x border-t border-slate-100 overflow-hidden pb-safe ${menuOpenId ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div className="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-slate-100" />
            <div className="px-3 pb-5 pt-1 space-y-1">
              <button
                onClick={() => handleDelayedAction(() => {
                  if (item && canRetirar) onMoveStock(item, 'SALIDA');
                })}
                disabled={!canRetirar}
                className="flex w-full items-center gap-4 px-5 py-4 text-sm font-bold text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors rounded-2xl disabled:opacity-30 disabled:grayscale"
              >
                <ArrowUpRight className="h-5 w-5" /> Retirar equipo
              </button>

              <button
                onClick={() => handleDelayedAction(() => {
                  if (item && canDevolver) onMoveStock(item, 'INGRESO');
                })}
                disabled={!canDevolver}
                className="flex w-full items-center gap-4 px-5 py-4 text-sm font-bold text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors rounded-2xl disabled:opacity-30 disabled:grayscale"
              >
                <ArrowDownLeft className="h-5 w-5" /> Devolver equipo
              </button>

              <div className="mx-4 border-t border-slate-50 my-1" />

              <button
                onClick={() => handleDelayedAction(() => {
                  if (item) onEdit(item);
                })}
                className="flex w-full items-center gap-4 px-5 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors rounded-2xl"
              >
                <Edit2 className="h-5 w-5 text-slate-400" /> Editar equipo
              </button>

              <div className="mx-4 border-t border-slate-50" />

              <button
                onClick={() => handleDelayedAction(() => {
                  if (item) onDelete(item);
                })}
                className="flex w-full items-center gap-4 px-5 py-4 text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors rounded-2xl"
              >
                <Trash2 className="h-5 w-5" /> Eliminar equipo
              </button>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>,
    document.body
  );
}