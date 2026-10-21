import React from 'react';
import { Tv, CheckCircle2, AlertTriangle, ListVideo, Image, Plus, RefreshCw, Radio, Wifi, WifiOff } from 'lucide-react';
import { Screen, ScreenGroup, Playlist, Media } from '../types';

interface DashboardProps {
  screens: Screen[];
  groups: ScreenGroup[];
  playlists: Playlist[];
  media: Media[];
  onOpenPairModal: () => void;
  onOpenUploadModal: () => void;
  onOpenPlaylistModal: () => void;
  onOpenScheduleModal: () => void;
  onSyncScreen: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  screens,
  groups,
  playlists,
  media,
  onOpenPairModal,
  onOpenUploadModal,
  onOpenPlaylistModal,
  onOpenScheduleModal,
  onSyncScreen
}) => {
  const pairedScreens = screens.filter((s) => s.isPaired);
  const onlineScreens = pairedScreens.filter((s) => s.status === 'ONLINE');
  const offlineScreens = pairedScreens.filter((s) => s.status === 'OFFLINE');

  return (
    <div className="space-y-6">
      {/* Top Banner / 3-Click Quick Actions (UX-6.1) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Yayın Kontrol Merkezi</h2>
            <p className="text-xs text-slate-400 mt-1">
              3 adımda hızlı yayın: <span className="text-sky-400 font-semibold">1. Yükle → 2. Playlist Yap → 3. TV/Kata Ata</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenUploadModal}
              className="btn-secondary"
            >
              <Image className="w-4 h-4 text-emerald-400" />
              1. Medya Yükle
            </button>
            <button
              onClick={onOpenPlaylistModal}
              className="btn-secondary"
            >
              <ListVideo className="w-4 h-4 text-purple-400" />
              2. Playlist Yap
            </button>
            <button
              onClick={onOpenScheduleModal}
              className="btn-secondary"
            >
              <Radio className="w-4 h-4 text-amber-400" />
              3. Yayına Ata
            </button>
            <button
              onClick={onOpenPairModal}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Yeni TV Eşleştir
            </button>
          </div>
        </div>
      </div>

      {/* Offline Alert Box if any screen is disconnected */}
      {offlineScreens.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-300">
                {offlineScreens.length} TV Ekranı Çevrimdışı (Sinyal Alınamıyor)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {offlineScreens.map((s) => s.name).join(', ')} — Lütfen ekranların açık ve ağa bağlı olduğunu kontrol edin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Screens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Toplam TV Ekranı</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {pairedScreens.length} <span className="text-xs text-slate-400 font-normal">/ 10 TV</span>
            </p>
          </div>
        </div>

        {/* Online Screens (UX-4.2 Multi-modal indicator) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Yayında (Çevrimiçi)</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-emerald-400">{onlineScreens.length}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Wifi className="w-3 h-3" />
                Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Offline Screens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Çevrimdışı TV</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className={`text-2xl font-bold ${offlineScreens.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {offlineScreens.length}
              </p>
              {offlineScreens.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  <WifiOff className="w-3 h-3" />
                  Bağlantı Yok
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Playlists & Media */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Playlist / Medya</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {playlists.length} <span className="text-xs text-slate-400 font-normal">/ {media.length} Dosya</span>
            </p>
          </div>
        </div>
      </div>

      {/* Floor Groups Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Katlara Göre TV Durum Haritası</h3>
          <span className="text-xs text-slate-400 font-medium">{groups.length} Kat / Bölüm Tanımlı</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const groupScreens = pairedScreens.filter((s) => s.groupId === group.id);
            const groupOnline = groupScreens.filter((s) => s.status === 'ONLINE').length;
            const assignedPlaylist = group.assignments?.find((a) => a.isDefault)?.playlist;

            return (
              <div
                key={group.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-sm">{group.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {group.description || 'Kat açıklaması belirtilmedi.'}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                    {groupOnline}/{groupScreens.length} TV Aktif
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Varsayılan Yayın:</span>
                    <span className="font-semibold text-slate-200">
                      {assignedPlaylist ? assignedPlaylist.name : 'Atama Yok'}
                    </span>
                  </div>

                  {groupScreens.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">Bu kata henüz TV atanmadı.</p>
                  ) : (
                    <div className="space-y-1.5 mt-2">
                      {groupScreens.map((screen) => (
                        <div
                          key={screen.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60"
                        >
                          <div className="flex items-center gap-2 truncate mr-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                screen.status === 'ONLINE' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-400'
                              }`}
                            />
                            <span className="text-xs font-medium text-slate-200 truncate">{screen.name}</span>
                          </div>
                          <button
                            onClick={() => onSyncScreen(screen.id)}
                            title="Ekranı Yenile"
                            aria-label={`${screen.name} ekranını yenile`}
                            className="btn-ghost p-1 text-slate-400 hover:text-sky-400 shrink-0"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
