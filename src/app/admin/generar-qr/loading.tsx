'use client';

import { Sk, SkeletonFilterRow } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <Sk className="h-8 w-64 rounded-xl" />
        <Sk className="h-4 w-96 rounded-lg" />
        <div className="flex gap-3">
          <Sk className="h-12 flex-1 rounded-xl" />
          <Sk className="h-12 w-32 rounded-xl" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
            <SkeletonFilterRow count={6} height="h-9" />
        </div>
        <div className="flex flex-wrap gap-2">
            <SkeletonFilterRow count={4} height="h-8" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-4">
              <Sk className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Sk className="h-4 w-32" />
                <Sk className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
