import React, { useState, useMemo } from 'react';
import { ListVideo, Plus, Trash2, Edit2, Clock, Layers, Filter } from 'lucide-react';
import { Playlist } from '../types';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchInput } from '../components/ui/SearchInput';
import { formatDuration } from '../utils/format';

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

  const filteredPlaylists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return playlists;
    return playlists.filter(
      (p) => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)
    );
  }, [playlists, searchTerm]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Playlistler</h2>
          <p className="text-sm text-slate-400 mt-1">Ekranlarda döngü halinde oynatılacak içerik sıraları</p>
        </div>
        <button onClick={onOpenCreateModal} className="btn-primary">
          <Plus className="w-4 h-4" />
          Yeni playlist
        </button>
      </div>

      {playlists.length > 0 && <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Playlist ara" />}

      {playlists.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title="Henüz playlist yok"
          description="Ekranlarda yayın başlatmak için medyalardan oluşan ilk playlist'inizi oluşturun."
        >
          <button onClick={onOpenCreateModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            İlk playlist'i oluştur
          </button>
        </EmptyState>
      ) : filteredPlaylists.length === 0 ? (
        <EmptyState icon={Filter} title={`"${searchTerm}" ile eşleşen playlist yok`}>
          <button onClick={() => setSearchTerm('')} className="btn-secondary">
            Aramayı temizle
          </button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => onOpenEditModal(playlist)} className="text-left min-w-0 group">
                  <h4 className="font-semibold text-white text-sm truncate group-hover:text-sky-300">{playlist.name}</h4>
                  <p className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {playlist.items?.length || 0} içerik
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(playlist.totalDuration)}
                    </span>
                  </p>
                  {playlist.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{playlist.description}</p>
                  )}
                </button>
                <button
                  onClick={() => onDeletePlaylist(playlist.id)}
                  title="Sil"
                  aria-label={`${playlist.name} sil`}
                  className="btn-ghost hover:text-rose-400 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {playlist.items && playlist.items.length > 0 ? (
                <ol className="space-y-1">
                  {playlist.items.slice(0, 4).map((item, idx) => (
                    <li key={item.id || idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-950/70">
                      <span className="text-slate-300 truncate">
                        {idx + 1}. {item.media?.title || 'Medya'}
                      </span>
                      <span className="text-slate-500 font-mono shrink-0 ml-2">{item.duration} sn</span>
                    </li>
                  ))}
                  {playlist.items.length > 4 && (
                    <li className="text-xs text-slate-500 text-right">+{playlist.items.length - 4} öğe daha</li>
                  )}
                </ol>
              ) : (
                <p className="text-xs text-slate-500">Bu listede henüz içerik yok.</p>
              )}

              <button onClick={() => onOpenEditModal(playlist)} className="btn-secondary w-full mt-auto">
                <Edit2 className="w-4 h-4" />
                Düzenle
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
