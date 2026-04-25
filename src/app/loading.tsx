'use client';

import BouncyLoader from '@/components/TreadmillLoader';

export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-5">
      <BouncyLoader />
      <p className="text-[12px] font-semibold tracking-[0.2em] text-slate-500 uppercase select-none">
        Cargando...
      </p>
    </div>
  );
}
