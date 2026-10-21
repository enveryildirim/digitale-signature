import React, { useState } from 'react';
import { Tv, Plus, RefreshCw, Unlink, Trash2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Screen, ScreenGroup } from '../types';

interface ScreensProps {
  screens: Screen[];
  groups: ScreenGroup[];
  onOpenPairModal: () => void;
  onSyncScreen: (id: string) => void;
  onSyncAll: () => void;
  onUnpairScreen: (id: string) => void;
  onDeleteScreen: (id: string) => void;
  onUpdateScreenGroup: (id: string, groupId: string | null) => void;
}

export const Screens: React.FC<ScreensProps> = ({
  screens,
  groups,
  onOpenPairModal,
  onSyncScreen,
  onSyncAll,
  onUnpairScreen,
  onDeleteScreen,
  onUpdateScreenGroup
}) => {
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'unpaired'>('all');

  const filtered = screens.filter((s) => {
    if (filter === 'online') return s.isPaired && s.status === 'ONLINE';
    if (filter === 'offline') return s.isPaired && s.status === 'OFFLINE';
    if (filter === 'unpaired') return !s.isPaired;
    return true;
  });

  const formatLastSeen = (isoStr?: string | null) => {
    if (!isoStr) return 'Bilinmiyor';
    const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">TV Ekranları Yönetimi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Kurumdaki tüm TV ekranlarının canlı durumu ve eşleştirmesi
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSyncAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            Tümünü Yenile
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tüm Ekranlar ({screens.length})
        </button>
        <button
          onClick={() => setFilter('online')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'online' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Çevrimiçi ({screens.filter((s) => s.isPaired && s.status === 'ONLINE').length})
        </button>
        <button
          onClick={() => setFilter('offline')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'offline' ? 'bg-slate-800 text-red-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Çevrimdışı ({screens.filter((s) => s.isPaired && s.status === 'OFFLINE').length})
        </button>
        <button
          onClick={() => setFilter('unpaired')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'unpaired' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Onay Bekleyenler ({screens.filter((s) => !s.isPaired).length})
        </button>
      </div>

      {/* Screens Table / Cards */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <Tv className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">Henüz TV Ekranı Bulunamadı</h4>
          <p className="text-xs text-slate-500 mt-1">
            TV'deki tarayıcıda <span className="font-mono text-sky-400">/player</span> adresini açarak ekranda çıkan kod ile yeni TV ekleyebilirsiniz.
          </p>
          <button
            onClick={onOpenPairModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition"
          >
            <Plus className="w-4 h-4" />
            TV Eşleştir
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((screen) => (
            <div
              key={screen.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg"
            >
              <div>
                {/* Header: Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-800 text-sky-400 rounded-xl border border-slate-700">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{screen.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {screen.group ? screen.group.name : 'Kat atanmamış'}
                      </p>
                    </div>
                  </div>

                  {screen.isPaired ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        screen.status === 'ONLINE'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : 'bg-red-950/60 text-red-400 border-red-800'
                      }`}
                    >
                      {screen.status === 'ONLINE' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          ONLINE
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          OFFLINE
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
                      KOD: {screen.pairingCode}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Kat Değiştir:</span>
                    <select
                      value={screen.groupId || ''}
                      onChange={(e) => onUpdateScreenGroup(screen.id, e.target.value || null)}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="">(Bağımsız)</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Son Görülme:</span>
                    <span className="text-slate-300 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatLastSeen(screen.lastSeen)}
                    </span>
                  </div>

                  {screen.currentMedia && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Oynatılan:</span>
                      <span className="text-sky-400 font-medium truncate max-w-[150px]">
                        {screen.currentMedia}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => onSyncScreen(screen.id)}
                  title="TV Yayınını Hemen Güncelle"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                  Yenile
                </button>

                <div className="flex items-center gap-1">
                  {screen.isPaired && (
                    <button
                      onClick={() => onUnpairScreen(screen.id)}
                      title="Eşleştirmeyi Sıfırla (TV yeni kod gösterir)"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteScreen(screen.id)}
                    title="Ekranı Sil"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
