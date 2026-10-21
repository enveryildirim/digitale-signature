import React from 'react';
import { Tv, FolderTree, Image, ListVideo, CalendarClock, LayoutDashboard, LogOut, ExternalLink, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  onSyncAll: () => void;
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
  onSyncAll,
  onlineCount,
  totalScreens,
  isEmergencyActive = false,
  onOpenEmergencyModal
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'screens', label: 'TV Ekranları', icon: Tv, badge: `${onlineCount}/${totalScreens}` },
    { id: 'groups', label: 'Katlar & Gruplar', icon: FolderTree },
    { id: 'media', label: 'Medya Kütüphanesi', icon: Image },
    { id: 'playlists', label: 'Oynatma Listeleri', icon: ListVideo },
    { id: 'schedules', label: 'Yayın Zamanlama', icon: CalendarClock },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Kurum İçi Bilgi Ekranı
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Digital Signage
                </span>
              </div>
              <p className="text-xs text-slate-400">Merkezi TV Yayın Yönetimi</p>
            </div>
          </div>

          {/* Quick Actions & User */}
          <div className="flex items-center space-x-3">
            {onOpenEmergencyModal && (
              <button
                onClick={onOpenEmergencyModal}
                title="Tüm TV'lere acil durum anonsu bas veya kaldır"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                  isEmergencyActive
                    ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/50'
                    : 'bg-red-950/40 text-red-400 hover:bg-red-900/60 border-red-800/80'
                }`}
              >
                🚨 {isEmergencyActive ? 'Acil Yayın Aktif' : 'Acil Durum'}
              </button>
            )}

            <button
              onClick={onSyncAll}
              title="Tüm ekranlara yayın yenileme sinyali gönder"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              Tüm TV'leri Yenile
            </button>

            <a
              href="/player"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              TV Player Aç
            </a>

            <div className="h-6 w-px bg-slate-800" />

            <div className="flex items-center space-x-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-slate-200">{user?.name || user?.username}</p>
                <p className="text-[10px] text-sky-400 font-semibold">{user?.role === 'ADMIN' ? 'Yönetici' : 'Editör'}</p>
              </div>
              <button
                onClick={onLogout}
                title="Çıkış Yap"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-sky-800 text-white' : 'bg-slate-800 text-emerald-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
