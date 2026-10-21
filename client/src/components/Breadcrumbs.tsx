import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  subtitle?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentTab, onSelectTab, subtitle }) => {
  const tabLabels: Record<string, string> = {
    dashboard: 'Genel Bakış',
    screens: 'TV Ekranları',
    groups: 'Katlar & Gruplar',
    media: 'Medya Kütüphanesi',
    playlists: 'Oynatma Listeleri',
    schedules: 'Yayın Zamanlama'
  };

  const currentLabel = tabLabels[currentTab] || 'Sayfa';

  return (
    <nav aria-label="Ekmek Kırıntısı Navigasyonu" className="mb-4">
      <ol className="flex items-center space-x-2 text-xs font-medium text-slate-400">
        <li>
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-1.5 hover:text-sky-400 transition focus-visible:ring-1 focus-visible:ring-sky-500 rounded px-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ana Panel</span>
          </button>
        </li>
        {currentTab !== 'dashboard' && (
          <>
            <li aria-hidden="true">
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </li>
            <li>
              <span className="text-slate-200 font-semibold" aria-current="page">
                {currentLabel}
              </span>
            </li>
          </>
        )}
        {subtitle && (
          <>
            <li aria-hidden="true">
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </li>
            <li>
              <span className="text-sky-400 font-mono text-[11px] px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">
                {subtitle}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
};

