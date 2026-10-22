import React from 'react';
import { Tv, Image, ListVideo, CalendarClock, LogOut, Siren } from 'lucide-react';
import { User } from '../types';

export const TAB_IDS = ['screens', 'media', 'playlists', 'schedules'] as const;
export type Tab = (typeof TAB_IDS)[number];

interface NavbarProps {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
  user: User | null;
  onLogout: () => void;
  onlineCount: number;
  totalScreens: number;
  isEmergencyActive?: boolean;
  onOpenEmergencyModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  onlineCount,
  totalScreens,
  isEmergencyActive = false,
  onOpenEmergencyModal
}) => {
  const allOnline = totalScreens > 0 && onlineCount === totalScreens;
  const navItems: Array<{ id: Tab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'screens', label: 'Ekranlar', icon: Tv, badge: `${onlineCount}/${totalScreens}` },
    { id: 'media', label: 'Medya', icon: Image },
    { id: 'playlists', label: 'Playlistler', icon: ListVideo },
    { id: 'schedules', label: 'Zamanlama', icon: CalendarClock }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">
        {/* Brand */}
        <button
          type="button"
          onClick={() => setCurrentTab('screens')}
          className="flex items-center gap-2.5 shrink-0"
          aria-label="Ana sayfa: Ekranlar"
        >
          <span className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white">
            <Tv className="w-5 h-5" />
          </span>
          <span className="hidden lg:block text-base font-bold text-white">Bilgi Ekranı</span>
        </button>

        {/* Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : ''}`} />
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 rounded-full text-xs font-semibold ${
                      allOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Emergency + user */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenEmergencyModal && (
            <button
              onClick={onOpenEmergencyModal}
              title="Tüm TV'lere acil durum anonsu bas veya kaldır"
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border transition ${
                isEmergencyActive
                  ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/50'
                  : 'bg-red-950/40 text-red-400 hover:bg-red-900/60 border-red-800/80'
              }`}
            >
              <Siren className="w-4 h-4" />
              <span className="hidden md:inline">{isEmergencyActive ? 'Acil yayın aktif' : 'Acil durum'}</span>
            </button>
          )}

          <span className="hidden md:block text-sm text-slate-300 pl-2">{user?.name || user?.username}</span>
          <button onClick={onLogout} title="Çıkış yap" aria-label="Çıkış yap" className="btn-ghost hover:text-red-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
