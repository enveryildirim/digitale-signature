import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ListVideo, Plus, Trash2, Edit2, Clock, Layers, Search, X, Filter } from 'lucide-react';
import { Playlist } from '../types';

interface PlaylistsProps {
  playlists: Playlist[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (pl: Playlist) => void;
  onDeletePlaylist: (id: string) => Promise<void>;
}

export const Playlists: React.FC<PlaylistsProps> = ({
  playlists,
  onOpenCreateModal,
  onOpenEditModal,
  onDeletePlaylist
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatTime = (sec?: number) => {
    if (!sec) return '0 sn';
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    if (mins === 0) return `${sec} sn`;
    return `${mins} dk ${remaining > 0 ? remaining + ' sn' : ''}`;
  };

  const filteredPlaylists = useMemo(() => {
    if (!searchTerm.trim()) return playlists;
    const term = searchTerm.toLowerCase();
    return playlists.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }, [playlists, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Oynatma Listeleri (Playlists)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ekranlarda döngü halinde oynatılacak içerik akışlarını oluşturun ve sıralayın
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Yeni Oynatma Listesi Oluştur
        </button>
      </div>

      {/* Search Bar (UX-2.3) */}
      {playlists.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Oynatma listesi adına göre ara... (/)"
              className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Aramayı Temizle"
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-400 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800">
            Toplam: {filteredPlaylists.length} / {playlists.length} Liste
          </span>
        </div>
      )}

      {/* Main Content Area */}
      {playlists.length === 0 ? (
        /* Empty State: Initial Zero State */
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <ListVideo className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-200">Henüz Oynatma Listesi Yok</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            TV ekranlarında yayın başlatmak için medyalardan oluşan ilk oynatma listenizi oluşturun.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-5 btn-primary"
          >
            <Plus className="w-4 h-4" />
            İlk Oynatma Listesini Oluştur
          </button>
        </div>
      ) : filteredPlaylists.length === 0 ? (
        /* Empty State: Search No Results */
        <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center bg-slate-900/40">
          <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-200">Arama Kriterine Uygun Playlist Bulunamadı</h4>
          <p className="text-xs text-slate-400 mt-1">
            "{searchTerm}" ifadesiyle eşleşen bir oynatma listesi bulunamadı.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 btn-secondary"
          >
            Aramayı Temizle
          </button>
        </div>
      ) : (
        /* Playlist Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaylists.map((playlist) => {
            return (
              <div
                key={playlist.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                        <ListVideo className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm tracking-wide">{playlist.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-500" />
                            {playlist.items?.length || 0} İçerik
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-sky-400 font-semibold">
                            <Clock className="w-3 h-3 text-sky-400" />
                            {formatTime(playlist.totalDuration)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditModal(playlist)}
                        title="Oynatma Listesini Düzenle"
                        aria-label={`${playlist.name} listesini düzenle`}
                        className="btn-ghost"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePlaylist(playlist.id)}
                        title="Oynatma Listesini Sil"
                        aria-label={`${playlist.name} listesini sil`}
                        className="btn-ghost text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {playlist.description || 'Açıklama belirtilmedi.'}
                  </p>

                  {/* Items preview strip */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                      İçerik Sıralaması:
                    </span>
                    {(!playlist.items || playlist.items.length === 0) ? (
                      <p className="text-xs text-slate-500 italic">Bu listede henüz içerik yok.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {playlist.items.slice(0, 4).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60"
                          >
                            <span className="text-slate-300 font-medium truncate max-w-[190px]">
                              {idx + 1}. {item.media?.title || 'Medya'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                              {item.duration} sn
                            </span>
                          </div>
                        ))}
                        {playlist.items.length > 4 && (
                          <p className="text-[11px] text-slate-400 text-right font-medium">
                            +{playlist.items.length - 4} diğer öğe...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onOpenEditModal(playlist)}
                    className="w-full btn-secondary text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Listeyi ve Süreleri Düzenle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
