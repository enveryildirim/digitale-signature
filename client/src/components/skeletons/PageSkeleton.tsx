import React from 'react';

interface PageSkeletonProps {
  tab: string;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ tab }) => {
  if (tab === 'screens') {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-40 h-6 bg-slate-800 rounded" />
            <div className="w-48 h-4 bg-slate-800/80 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-28 h-10 bg-slate-800 rounded-xl" />
            <div className="w-36 h-10 bg-sky-900/40 rounded-xl" />
          </div>
        </div>
        {[1, 2].map((section) => (
          <div key={section} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex justify-between">
              <div className="w-40 h-5 bg-slate-800 rounded" />
              <div className="w-52 h-8 bg-slate-800 rounded-lg" />
            </div>
            {[1, 2, 3].map((row) => (
              <div key={row} className="px-4 py-4 flex items-center gap-4 border-b border-slate-800/60 last:border-0">
                <div className="w-2.5 h-2.5 bg-slate-700 rounded-full" />
                <div className="w-40 h-4 bg-slate-800 rounded" />
                <div className="flex-1 h-4 bg-slate-800/60 rounded" />
                <div className="w-52 h-8 bg-slate-800 rounded-lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'media') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-44 h-6 bg-slate-800 rounded" />
            <div className="w-64 h-3.5 bg-slate-800/80 rounded" />
          </div>
          <div className="w-36 h-10 bg-sky-900/40 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-64 flex flex-col justify-between">
              <div className="h-44 bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 bg-slate-800 rounded-lg" />
              </div>
              <div className="p-3 border-t border-slate-800 flex items-center justify-between">
                <div className="w-28 h-4 bg-slate-800 rounded" />
                <div className="w-8 h-8 bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Generic fallback skeleton for Playlists and Schedules
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-48 h-6 bg-slate-800 rounded" />
          <div className="w-64 h-3.5 bg-slate-800/80 rounded" />
        </div>
        <div className="w-36 h-10 bg-sky-900/40 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-48 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-36 h-5 bg-slate-800 rounded" />
              <div className="w-8 h-8 bg-slate-800 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="w-full h-3.5 bg-slate-800/60 rounded" />
              <div className="w-3/4 h-3.5 bg-slate-800/60 rounded" />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <div className="w-20 h-4 bg-slate-800 rounded" />
              <div className="w-24 h-6 bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

