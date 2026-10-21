import React from 'react';
import { Tv, CheckCircle2, AlertTriangle, ListVideo, Image, Plus, RefreshCw, Radio } from 'lucide-react';
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
      {/* Top Banner / 3-Click Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Yayın Kontrol Merkezi</h2>
            <p className="text-xs text-slate-400 mt-1">
              3 adımda hızlı yayın: <span className="text-sky-400 font-semibold">Yükle → Playlist Oluştur → TV/Kata Ata</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            >
              <Image className="w-4 h-4 text-emerald-400" />
              1. Medya Yükle
            </button>
            <button
              onClick={onOpenPlaylistModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            >
              <ListVideo className="w-4 h-4 text-purple-400" />
              2. Playlist Yap
            </button>
            <button
              onClick={onOpenScheduleModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            >
              <Radio className="w-4 h-4 text-amber-400" />
              3. Yayına Ata
            </button>
            <button
              onClick={onOpenPairModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              Yeni TV Eşleştir
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Screens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Toplam TV Ekranı</p>
            <p className="text-2xl font-bold text-white mt-0.5">{pairedScreens.length} <span className="text-xs text-slate-500 font-normal">/ 10 Hedef</span></p>
          </div>
        </div>

        {/* Online Screens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Yayında (Çevrimiçi)</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-emerald-400">{onlineScreens.length}</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* Offline Screens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Çevrimdışı TV</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              <span className={offlineScreens.length > 0 ? 'text-red-400' : 'text-slate-300'}>
                {offlineScreens.length}
              </span>
            </p>
          </div>
        </div>

        {/* Playlists & Media */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Playlist / Medya</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {playlists.length} <span className="text-xs text-slate-500 font-normal">/ {media.length} Dosya</span>
            </p>
          </div>
        </div>
      </div>

      {/* Floor Groups Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Katlara Göre TV Durum Haritası</h3>
          <span className="text-xs text-slate-400">{groups.length} Kat / Alan Tanımlı</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const groupScreens = pairedScreens.filter((s) => s.groupId === group.id);
            const groupOnline = groupScreens.filter((s) => s.status === 'ONLINE').length;
            const assignedPlaylist = group.assignments?.find((a) => a.isDefault)?.playlist;

            return (
              <div
                key={group.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-sm">{group.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {group.description || 'Kat açıklaması belirtilmedi.'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                    {groupOnline}/{groupScreens.length} Aktif
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Varsayılan Yayın:</span>
                    <span className="font-medium text-slate-200">
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
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60"
                        >
                          <div className="flex items-center gap-2 truncate mr-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                screen.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-red-400'
                              }`}
                            />
                            <span className="text-xs font-medium text-slate-200 truncate">{screen.name}</span>
                          </div>
                          <button
                            onClick={() => onSyncScreen(screen.id)}
                            title="Ekranı Yenile"
                            className="p-1 text-slate-400 hover:text-sky-400 shrink-0"
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
