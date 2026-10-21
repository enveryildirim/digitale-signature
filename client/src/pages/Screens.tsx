import React, { useState } from 'react';
import {
  Tv,
  Plus,
  RefreshCw,
  Unlink,
  Trash2,
  Clock,
  Eye,
  Building2,
  LayoutGrid,
  List,
  Settings,
  X,
  Search,
  Film,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Screen, ScreenGroup, Playlist } from '../types';

interface ScreensProps {
  screens: Screen[];
  groups: ScreenGroup[];
  playlists: Playlist[];
  onOpenPairModal: (initialCode?: string) => void;
  onSyncScreen: (id: string) => void;
  onSyncAll: () => void;
  onUnpairScreen: (id: string) => void;
  onDeleteScreen: (id: string) => void;
  onUpdateScreen: (id: string, data: { name?: string; groupId?: string | null }) => Promise<void>;
  onQuickAssignScreen: (screenId: string, playlistId: string | null) => Promise<void>;
  onQuickAssignGroup: (groupId: string, playlistId: string | null) => Promise<void>;
  onPreviewScreen?: (screen: Screen) => void;
  onOpenPlaylistModal?: () => void;
}

export const Screens: React.FC<ScreensProps> = ({
  screens,
  groups,
  playlists,
  onOpenPairModal,
  onSyncScreen,
  onSyncAll,
  onUnpairScreen,
  onDeleteScreen,
  onUpdateScreen,
  onQuickAssignScreen,
  onQuickAssignGroup,
  onPreviewScreen,
  onOpenPlaylistModal
}) => {
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'unpaired'>('all');
  const [viewMode, setViewMode] = useState<'floors' | 'cards' | 'table'>('floors');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroupId, setEditGroupId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Time formatting helper
  const formatLastSeen = (isoStr?: string | null) => {
    if (!isoStr) return 'Bilinmiyor';
    const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to find effective playlist for a screen
  const getScreenPlaylistInfo = (screen: Screen) => {
    const directDefault = screen.assignments?.find((a) => a.isDefault);
    if (directDefault && directDefault.playlist) {
      return {
        playlistId: directDefault.playlistId || directDefault.playlist.id,
        playlistName: directDefault.playlist.name,
        isDirect: true,
        sourceLabel: 'Bu Ekrana Özel'
      };
    }

    // Check floor group assignment
    const group = groups.find((g) => g.id === screen.groupId) || screen.group;
    const groupDefault = group?.assignments?.find((a) => a.isDefault);
    if (groupDefault && groupDefault.playlist) {
      return {
        playlistId: groupDefault.playlistId || groupDefault.playlist.id,
        playlistName: groupDefault.playlist.name,
        isDirect: false,
        sourceLabel: `${group?.name || 'Kat'} Yayını`
      };
    }

    return {
      playlistId: null,
      playlistName: 'Yayın Atanmamış',
      isDirect: false,
      sourceLabel: 'Yayın Yok'
    };
  };

  // Filtered screens
  const filtered = screens.filter((s) => {
    // Status filter
    if (filter === 'online' && (!s.isPaired || s.status !== 'ONLINE')) return false;
    if (filter === 'offline' && (!s.isPaired || s.status !== 'OFFLINE')) return false;
    if (filter === 'unpaired' && s.isPaired) return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = s.name.toLowerCase().includes(term);
      const matchGroup = s.group?.name?.toLowerCase().includes(term);
      const matchCode = s.pairingCode?.toLowerCase().includes(term);
      if (!matchName && !matchGroup && !matchCode) return false;
    }

    return true;
  });

  const unpairedScreens = screens.filter((s) => !s.isPaired);
  const onlineCount = screens.filter((s) => s.isPaired && s.status === 'ONLINE').length;
  const offlineCount = screens.filter((s) => s.isPaired && s.status === 'OFFLINE').length;

  const handleOpenEdit = (screen: Screen) => {
    setEditingScreen(screen);
    setEditName(screen.name);
    setEditGroupId(screen.groupId || '');
  };

  const handleSaveEdit = async () => {
    if (!editingScreen) return;
    try {
      setSavingEdit(true);
      await onUpdateScreen(editingScreen.id, {
        name: editName.trim() || editingScreen.name,
        groupId: editGroupId || null
      });
      setEditingScreen(null);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-wide">TV Ekranları Yönetimi</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800/60">
              {screens.length} TV
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kurumdaki TV ekranlarının canlı yayını, durumu ve tek tıkla playlist kontrolü
          </p>
        </div>

        {/* Quick Summary Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Çevrimiçi:</span>
            <span className="text-emerald-400 font-bold">{onlineCount}</span>
            <span className="text-slate-600 mx-1">|</span>
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span className="text-slate-300 font-medium">Çevrimdışı:</span>
            <span className="text-red-400 font-bold">{offlineCount}</span>
          </div>

          <button
            onClick={onSyncAll}
            title="Tüm TV Ekranlarına Anlık Yenileme Sinyali Gönder"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            Tümünü Yenile
          </button>

          <button
            onClick={() => onOpenPairModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            Yeni TV Eşleştir
          </button>
        </div>
      </div>

      {/* Smart Unpaired Notification Banner */}
      {unpairedScreens.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-600/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
              <Tv className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Yeni TV Bağlantı Bekliyor ({unpairedScreens.length})
                </span>
                <span className="text-[10px] bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  KOD: {unpairedScreens[0].pairingCode}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                TV ekranında kod görüntülendi. Ekranı hemen adlandırıp bir kata bağlayabilirsiniz.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenPairModal(unpairedScreens[0].pairingCode || '')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Hemen Eşleştir ve Adlandır
          </button>
        </div>
      )}

      {/* View Mode & Filter Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        {/* View Mode Selector */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('floors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'floors'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Kat Bazlı Görünüm
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'cards'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            TV Kartları
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'table'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Kompakt Tablo
          </button>
        </div>

        {/* Search & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="TV veya Kat Ara..."
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-40 sm:w-52 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Aramayı Temizle"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tümü ({screens.length})
            </button>
            <button
              onClick={() => setFilter('online')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === 'online'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Çevrimiçi ({onlineCount})
            </button>
            <button
              onClick={() => setFilter('offline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === 'offline'
                  ? 'bg-red-950/60 text-red-400 border border-red-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Çevrimdışı ({offlineCount})
            </button>
            {unpairedScreens.length > 0 && (
              <button
                onClick={() => setFilter('unpaired')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === 'unpaired'
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bekleyen ({unpairedScreens.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Screen List Content */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <Tv className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-200">
            {searchTerm ? 'Arama Kriterine Uygun TV Bulunamadı' : 'Ekran Bulunamadı'}
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `"${searchTerm}" aramasına uygun TV ekranı veya kat bulunamadı.`
              : 'Seçili filtreye uygun TV ekranı bulunamadı veya henüz TV eklenmedi.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="btn-secondary"
              >
                Aramayı Temizle
              </button>
            )}
            <button
              onClick={() => onOpenPairModal()}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Yeni TV Eşleştir
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 1. FLOOR GROUPED VIEW (Recommended Default) */}
          {viewMode === 'floors' && (
            <div className="space-y-8">
              {groups.map((group) => {
                const groupScreens = filtered.filter((s) => s.groupId === group.id);
                if (groupScreens.length === 0 && filter !== 'all') return null;

                const groupDefault = group.assignments?.find((a) => a.isDefault);
                const currentGroupPlaylistId = groupDefault?.playlistId || groupDefault?.playlist?.id || '';

                return (
                  <div key={group.id} className="space-y-3">
                    {/* Floor Header Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800/80 px-4 py-3 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {group.name}
                            <span className="text-[11px] font-normal text-slate-400">
                              ({groupScreens.length} TV)
                            </span>
                          </h3>
                          {group.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">{group.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Floor-Wide Quick Playlist Dropdown */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          Tüm Katın Yayını:
                        </span>
                        <select
                          value={currentGroupPlaylistId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__new__') {
                              onOpenPlaylistModal?.();
                            } else {
                              onQuickAssignGroup(group.id, val || null);
                            }
                          }}
                          className="bg-slate-950 border border-slate-700 hover:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 transition cursor-pointer"
                        >
                          <option value="">-- Kat Yayını Yok --</option>
                          {playlists.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              📋 {pl.name} ({pl.items?.length || 0} Medya)
                            </option>
                          ))}
                          <option value="__new__">➕ Yeni Playlist Oluştur...</option>
                        </select>
                      </div>
                    </div>

                    {/* Floor Screen Cards */}
                    {groupScreens.length === 0 ? (
                      <p className="text-xs text-slate-500 italic pl-3">
                        Bu kata henüz TV atanmadı.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupScreens.map((screen) => (
                          <ScreenCard
                            key={screen.id}
                            screen={screen}
                            playlists={playlists}
                            playlistInfo={getScreenPlaylistInfo(screen)}
                            onQuickAssignScreen={onQuickAssignScreen}
                            onSyncScreen={onSyncScreen}
                            onPreviewScreen={onPreviewScreen}
                            onOpenEdit={handleOpenEdit}
                            onOpenPlaylistModal={onOpenPlaylistModal}
                            formatLastSeen={formatLastSeen}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Independent / Unassigned Screens */}
              {filtered.some((s) => !s.groupId) && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 px-1">
                    <Tv className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-300">
                      Kat Atanmamış Bağımsız TV'ler (
                      {filtered.filter((s) => !s.groupId).length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered
                      .filter((s) => !s.groupId)
                      .map((screen) => (
                        <ScreenCard
                          key={screen.id}
                          screen={screen}
                          playlists={playlists}
                          playlistInfo={getScreenPlaylistInfo(screen)}
                          onQuickAssignScreen={onQuickAssignScreen}
                          onSyncScreen={onSyncScreen}
                          onPreviewScreen={onPreviewScreen}
                          onOpenEdit={handleOpenEdit}
                          onOpenPlaylistModal={onOpenPlaylistModal}
                          formatLastSeen={formatLastSeen}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. VISUAL CARDS VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((screen) => (
                <ScreenCard
                  key={screen.id}
                  screen={screen}
                  playlists={playlists}
                  playlistInfo={getScreenPlaylistInfo(screen)}
                  onQuickAssignScreen={onQuickAssignScreen}
                  onSyncScreen={onSyncScreen}
                  onPreviewScreen={onPreviewScreen}
                  onOpenEdit={handleOpenEdit}
                  onOpenPlaylistModal={onOpenPlaylistModal}
                  formatLastSeen={formatLastSeen}
                />
              ))}
            </div>
          )}

          {/* 3. COMPACT TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">TV Adı & Kat</th>
                      <th className="py-3 px-4">Durum</th>
                      <th className="py-3 px-4">Aktif Playlist (Hemen Ata)</th>
                      <th className="py-3 px-4">Oynatılan Medya</th>
                      <th className="py-3 px-4">Son Görülme</th>
                      <th className="py-3 px-4 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filtered.map((screen) => {
                      const plInfo = getScreenPlaylistInfo(screen);
                      return (
                        <tr
                          key={screen.id}
                          className="hover:bg-slate-800/40 transition group"
                        >
                          {/* TV Name & Floor */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-slate-800 text-sky-400 rounded-lg border border-slate-700">
                                <Tv className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-semibold text-white block">
                                  {screen.name}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {screen.group?.name || 'Bağımsız TV'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {screen.isPaired ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  screen.status === 'ONLINE'
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                    : 'bg-red-950/60 text-red-400 border-red-800'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    screen.status === 'ONLINE'
                                      ? 'bg-emerald-400 animate-pulse'
                                      : 'bg-red-400'
                                  }`}
                                ></span>
                                {screen.status}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
                                KOD: {screen.pairingCode}
                              </span>
                            )}
                          </td>

                          {/* Inline Playlist Dropdown */}
                          <td className="py-3 px-4">
                            {screen.isPaired ? (
                              <div className="space-y-1">
                                <select
                                  value={plInfo.isDirect ? plInfo.playlistId || '' : ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '__new__') {
                                      onOpenPlaylistModal?.();
                                    } else {
                                      onQuickAssignScreen(screen.id, val || null);
                                    }
                                  }}
                                  className="w-full max-w-[220px] bg-slate-950 border border-slate-700 hover:border-sky-500 rounded px-2 py-1 text-xs text-sky-300 font-medium focus:outline-none transition cursor-pointer"
                                >
                                  {screen.groupId && (
                                    <option value="">
                                      🏢 Kat Yayını ({screen.group?.name || 'Kat'})
                                    </option>
                                  )}
                                  {!screen.groupId && <option value="">-- Yayın Yok --</option>}
                                  {playlists.map((pl) => (
                                    <option key={pl.id} value={pl.id}>
                                      📋 {pl.name}
                                    </option>
                                  ))}
                                  <option value="__new__">➕ Yeni Liste...</option>
                                </select>
                                <span className="block text-[10px] text-slate-500 font-mono">
                                  Kaynak: {plInfo.sourceLabel}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Eşleşme bekleniyor</span>
                            )}
                          </td>

                          {/* Current Media */}
                          <td className="py-3 px-4">
                            {screen.currentMedia ? (
                              screen.status === 'ONLINE' ? (
                                <span className="text-slate-200 font-medium flex items-center gap-1.5 truncate max-w-[150px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                                  <Film className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  {screen.currentMedia}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs flex items-center gap-1.5 truncate max-w-[150px]" title={`Son yayın: ${screen.currentMedia}`}>
                                  <WifiOff className="w-3 h-3 text-slate-500 shrink-0" />
                                  Son: {screen.currentMedia}
                                </span>
                              )
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          {/* Last Seen */}
                          <td className="py-3 px-4 text-slate-400 font-mono">
                            {formatLastSeen(screen.lastSeen)}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onPreviewScreen && screen.isPaired && (
                                <button
                                  onClick={() => onPreviewScreen(screen)}
                                  title="Canlı Simülasyonu İzle"
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                </button>
                              )}
                              <button
                                onClick={() => onSyncScreen(screen.id)}
                                title="Yayını Yenile"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(screen)}
                                title="Ayarlar"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Screen Settings / Edit Modal */}
      {editingScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-sky-400" />
                <h3 className="font-semibold text-white text-sm">
                  TV Ekranı Ayarları: {editingScreen.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingScreen(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* TV Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  TV Ekran Adı
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Örn: Danışma Giriş TV"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Floor Group */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Bulunduğu Kat / Alan
                </label>
                <select
                  value={editGroupId}
                  onChange={(e) => setEditGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">(Kat Atanmamış - Bağımsız TV)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Device Tech Info */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px] text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span>IP Adresi:</span>
                  <span className="text-slate-200">{editingScreen.ipAddress || 'Bilinmiyor'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Player Versiyonu:</span>
                  <span className="text-slate-200">{editingScreen.playerVersion || 'v1.0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Son Sinyal:</span>
                  <span className="text-slate-200">{formatLastSeen(editingScreen.lastSeen)}</span>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Cihaz Yönetimi
                </span>
                <div className="flex items-center gap-2">
                  {editingScreen.isPaired && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingScreen(null);
                        onUnpairScreen(editingScreen.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-amber-950/40 hover:bg-amber-900/50 text-amber-400 border border-amber-800/60 transition"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Eşleştirmeyi Sıfırla
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingScreen(null);
                      onDeleteScreen(editingScreen.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/60 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Ekranı Sil
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 bg-slate-950/80 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingScreen(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition"
              >
                {savingEdit ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// Sub-component: ScreenCard
// ==========================================
interface ScreenCardProps {
  screen: Screen;
  playlists: Playlist[];
  playlistInfo: {
    playlistId: string | null;
    playlistName: string;
    isDirect: boolean;
    sourceLabel: string;
  };
  onQuickAssignScreen: (screenId: string, playlistId: string | null) => Promise<void>;
  onSyncScreen: (id: string) => void;
  onPreviewScreen?: (screen: Screen) => void;
  onOpenEdit: (screen: Screen) => void;
  onOpenPlaylistModal?: () => void;
  formatLastSeen: (isoStr?: string | null) => string;
}

const ScreenCard: React.FC<ScreenCardProps> = ({
  screen,
  playlists,
  playlistInfo,
  onQuickAssignScreen,
  onSyncScreen,
  onPreviewScreen,
  onOpenEdit,
  onOpenPlaylistModal,
  formatLastSeen
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg group">
      <div>
        {/* Header: Name, Floor Badge & Settings Button */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-sky-400 rounded-xl border border-slate-700">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm tracking-tight">{screen.name}</h4>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-500" />
                {screen.group?.name || 'Bağımsız TV'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {screen.isPaired ? (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  screen.status === 'ONLINE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {screen.status === 'ONLINE' ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    Çevrimiçi
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    Çevrimdışı
                  </>
                )}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
                KOD: {screen.pairingCode}
              </span>
            )}

            <button
              onClick={() => onOpenEdit(screen)}
              title="Ekran Ayarları"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 16:9 Mini TV Frame Preview */}
        <div
          onClick={() => screen.isPaired && onPreviewScreen && onPreviewScreen(screen)}
          className={`aspect-video rounded-xl bg-slate-950 border-2 border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-3 mb-3 cursor-pointer transition group-hover:border-slate-700`}
        >
          {screen.isPaired ? (
            <>
              {screen.status === 'ONLINE' ? (
                screen.currentMedia ? (
                  <div className="text-center z-10 space-y-1">
                    <Film className="w-6 h-6 text-sky-400 mx-auto" />
                    <p className="text-xs font-semibold text-white px-2 truncate max-w-[190px]">
                      {screen.currentMedia}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Canlı Yayında
                    </span>
                  </div>
                ) : (
                  <div className="text-center z-10 text-slate-500 space-y-1">
                    <Tv className="w-6 h-6 mx-auto text-sky-400/80" />
                    <p className="text-[11px] text-slate-300 font-medium">Yayın Bekleniyor</p>
                    <span className="inline-block text-[10px] text-slate-500 font-mono">
                      (TV Açık)
                    </span>
                  </div>
                )
              ) : (
                <div className="text-center z-10 space-y-1">
                  <WifiOff className="w-6 h-6 text-slate-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-400 px-2 truncate max-w-[190px]">
                    {screen.currentMedia ? `Son: ${screen.currentMedia}` : 'TV Çevrimdışı'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-mono bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Sinyal Yok (Çevrimdışı)
                  </span>
                </div>
              )}

              {/* Hover Overlay */}
              {screen.status === 'ONLINE' ? (
                <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-200">
                  <Eye className="w-4 h-4" />
                  Canlı Önizle
                </div>
              ) : (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
                  <WifiOff className="w-4 h-4 text-rose-400" />
                  TV Çevrimdışı (Önizlenemez)
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-amber-400 space-y-1">
              <Tv className="w-6 h-6 mx-auto opacity-80" />
              <p className="text-[11px] font-bold">Eşleştirme Bekliyor</p>
              <p className="text-sm font-mono font-bold tracking-widest">{screen.pairingCode}</p>
            </div>
          )}
        </div>

        {/* Active Broadcast Inline Dropdown */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Yayınlanan Playlist:</span>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                playlistInfo.isDirect
                  ? 'bg-sky-950 text-sky-400 border border-sky-800/60'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {playlistInfo.sourceLabel}
            </span>
          </div>

          {screen.isPaired ? (
            <select
              value={playlistInfo.isDirect ? playlistInfo.playlistId || '' : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__new__') {
                  onOpenPlaylistModal?.();
                } else {
                  onQuickAssignScreen(screen.id, val || null);
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 hover:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 transition cursor-pointer"
            >
              {screen.groupId && (
                <option value="">
                  🏢 Kat Yayınına Uy ({screen.group?.name || 'Kat'})
                </option>
              )}
              {!screen.groupId && <option value="">-- Yayın Atanmamış --</option>}
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  📋 {pl.name} ({pl.items?.length || 0} Medya)
                </option>
              ))}
              <option value="__new__">➕ Yeni Playlist Oluştur...</option>
            </select>
          ) : (
            <div className="text-xs text-amber-400 italic bg-amber-950/20 p-1.5 rounded text-center">
              Eşleştirme tamamlanınca yayın atanabilir
            </div>
          )}
        </div>
      </div>

      {/* Footer: Live Preview, Refresh, Last Seen */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {onPreviewScreen && screen.isPaired && (
            <button
              onClick={() => onPreviewScreen(screen)}
              title="Canlı TV Simülasyonunu Aç"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              Canlı İzle
            </button>
          )}

          <button
            onClick={() => onSyncScreen(screen.id)}
            title="TV Yayınını Hemen Güncelle (WebSocket)"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-3 h-3 text-sky-400" />
            Yenile
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          {formatLastSeen(screen.lastSeen)}
        </span>
      </div>
    </div>
  );
};
