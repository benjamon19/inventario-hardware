'use client';

import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';

export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-5">
      <TailChase size="40" speed="1.75" color="#cbd5e1" />
      <p className="text-[12px] font-semibold tracking-[0.2em] text-slate-500 uppercase select-none">
        Cargando...
      </p>
    </div>
  );
}
