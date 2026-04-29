'use client';

import { Sk, SkeletonFilterRow } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Sk className="h-10 w-48 rounded-2xl" />
        <Sk className="h-12 w-full sm:w-48 rounded-2xl" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex flex-wrap gap-2">
            <SkeletonFilterRow count={5} height="h-8" />
          </div>
        </div>
        
        <div className="p-4 border-b border-slate-100">
           <Sk className="h-10 w-full max-w-md rounded-xl" />
        </div>

        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4"><Sk className="h-3 w-20" /></th>
                <th className="px-6 py-4"><Sk className="h-3 w-20" /></th>
                <th className="px-6 py-4"><Sk className="h-3 w-20" /></th>
                <th className="px-6 py-4"><Sk className="h-3 w-20" /></th>
              </tr>
            </thead>
            <tbody>
              {Array(6).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><Sk className="h-8 w-8 rounded-lg" /><Sk className="h-4 w-32" /></div></td>
                  <td className="px-6 py-4"><Sk className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><Sk className="h-4 w-24" /></td>
                  <td className="px-6 py-4"><Sk className="h-4 w-20" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4 p-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Sk className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Sk className="h-4 w-full" />
                <Sk className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
