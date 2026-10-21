import React from 'react';
import { ListVideo, Plus, Trash2, Edit2, Clock, Layers } from 'lucide-react';
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
  const formatTime = (sec?: number) => {
    if (!sec) return '0 sn';
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    if (mins === 0) return `${sec} sn`;
    return `${mins} dk ${remaining > 0 ? remaining + ' sn' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Oynatma Listeleri (Playlists)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ekranlarda döngü halinde oynatılacak içerik akışlarını oluşturun
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow-md shadow-sky-600/30"
        >
          <Plus className="w-4 h-4" />
          Yeni Playlist Oluştur
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <ListVideo className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">Henüz Playlist Yok</h4>
          <p className="text-xs text-slate-500 mt-1">
            Yayın başlatmak için medyalardan oluşan bir oynatma listesi oluşturun.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition"
          >
            <Plus className="w-4 h-4" />
            İlk Playlisti Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => {
            return (
              <div
                key={playlist.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                        <ListVideo className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{playlist.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-500" />
                            {playlist.items?.length || 0} İçerik
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-sky-400">
                            <Clock className="w-3 h-3 text-sky-500" />
                            {formatTime(playlist.totalDuration)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditModal(playlist)}
                        title="Düzenle"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePlaylist(playlist.id)}
                        title="Sil"
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                    {playlist.description || 'Açıklama belirtilmedi.'}
                  </p>

                  {/* Items preview strip */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
                      İçerik Sıralaması:
                    </span>
                    {(!playlist.items || playlist.items.length === 0) ? (
                      <p className="text-xs text-slate-500 italic">Bu liste boş.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {playlist.items.slice(0, 4).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-950/60"
                          >
                            <span className="text-slate-300 truncate max-w-[180px]">
                              {idx + 1}. {item.media?.title || 'Medya'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.duration} sn
                            </span>
                          </div>
                        ))}
                        {playlist.items.length > 4 && (
                          <p className="text-[10px] text-slate-500 text-right">
                            +{playlist.items.length - 4} diğer öğe...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
