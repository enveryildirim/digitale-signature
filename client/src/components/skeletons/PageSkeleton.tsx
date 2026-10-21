import React from 'react';

interface PageSkeletonProps {
  tab: string;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ tab }) => {
  if (tab === 'dashboard') {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Banner Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-28 flex flex-col justify-between">
          <div className="w-48 h-5 bg-slate-800 rounded-md" />
          <div className="flex gap-3">
            <div className="w-28 h-8 bg-slate-800 rounded-xl" />
            <div className="w-28 h-8 bg-slate-800 rounded-xl" />
            <div className="w-28 h-8 bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 h-24">
              <div className="w-12 h-12 bg-slate-800 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="w-20 h-4 bg-slate-800 rounded" />
                <div className="w-12 h-6 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Big Block */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-64 space-y-4">
          <div className="w-40 h-5 bg-slate-800 rounded" />
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-950/60 rounded-xl border border-slate-800/60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'screens') {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="w-48 h-6 bg-slate-800 rounded" />
            <div className="w-72 h-3.5 bg-slate-800/80 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-32 h-10 bg-slate-800 rounded-xl" />
            <div className="w-36 h-10 bg-sky-900/40 rounded-xl" />
          </div>
        </div>

        {/* Filter Bar Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 h-10 bg-slate-950 rounded-xl border border-slate-800" />
          <div className="flex gap-2 w-full md:w-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-8 bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>

        {/* TV Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg h-72 flex flex-col justify-between p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-4 bg-slate-800 rounded" />
                    <div className="w-16 h-3 bg-slate-800/80 rounded" />
                  </div>
                </div>
                <div className="w-16 h-6 bg-slate-800 rounded-full" />
              </div>
              <div className="h-32 bg-slate-950 rounded-xl border border-slate-800" />
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <div className="w-24 h-4 bg-slate-800 rounded" />
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg" />
                  <div className="w-8 h-8 bg-slate-800 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
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

  // Generic fallback skeleton for Playlists, Schedules, Groups
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

