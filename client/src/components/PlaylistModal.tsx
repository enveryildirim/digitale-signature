import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Clock, AlertCircle } from 'lucide-react';
import { Media, Playlist } from '../types';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist | null;
  allMedia: Media[];
  onSave: (data: { name: string; description?: string; items: Array<{ mediaId: string; duration: number }> }) => Promise<void>;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlist,
  allMedia,
  onSave
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Array<{ mediaId: string; duration: number; media?: Media }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      setItems(
        (playlist.items || []).map((i) => ({
          mediaId: i.mediaId,
          duration: i.duration,
          media: i.media
        }))
      );
    } else {
      setName('');
      setDescription('');
      setItems([]);
    }
    setError(null);
  }, [playlist, isOpen]);

  if (!isOpen) return null;

  const handleAddMedia = (media: Media) => {
    setItems((prev) => [
      ...prev,
      {
        mediaId: media.id,
        duration: media.duration || 10,
        media
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  const handleDurationChange = (index: number, duration: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], duration: Math.max(3, duration) };
      return next;
    });
  };

  const totalSeconds = items.reduce((sum, item) => sum + (item.duration || 10), 0);
  const formatTotalTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    if (mins === 0) return `${sec} sn`;
    return `${mins} dk ${remaining > 0 ? remaining + ' sn' : ''}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen playlist adı giriniz.');
      return;
    }
    if (items.length === 0) {
      setError('Lütfen oynatma listesine en az bir medya öğesi ekleyin.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        name: name.trim(),
        description: description ? description.trim() : undefined,
        items: items.map((i) => ({ mediaId: i.mediaId, duration: i.duration }))
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kayıt başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="font-semibold text-white text-base">
              {playlist ? 'Oynatma Listesini Düzenle' : 'Yeni Oynatma Listesi'}
            </h3>
            <p className="text-xs text-slate-400">İçerikleri sıralayın ve gösterim sürelerini belirleyin</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & Playlist Items (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/50 border border-red-800/60 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Playlist Adı <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ör: Zemin Kat Genel Tanıtım"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Açıklama (İsteğe bağlı)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ör: Mesai saatleri boyunca gösterilecek duyurular"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Selected Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">
                  Oynatma Sırası ({items.length} Öğe)
                </span>
                <span className="text-xs text-sky-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  Toplam Döngü: {formatTotalTime(totalSeconds)}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-950/30">
                  <p className="text-xs text-slate-400">Henüz medya eklenmedi.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Sağdaki listeden öğe seçerek buraya ekleyin.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {items.map((item, idx) => {
                    const media = item.media || allMedia.find((m) => m.id === item.mediaId);
                    return (
                      <div
                        key={`${item.mediaId}-${idx}`}
                        className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-center text-xs font-mono font-bold text-slate-500">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-medium text-white truncate max-w-[160px] sm:max-w-[200px]">
                              {media?.title || 'Medya'}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {media?.type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                            <input
                              type="number"
                              min={3}
                              max={600}
                              value={item.duration}
                              onChange={(e) => handleDurationChange(idx, Number(e.target.value))}
                              className="w-12 bg-transparent text-right text-xs text-sky-400 font-mono font-bold focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500">sn</span>
                          </div>

                          <div className="flex items-center">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMove(idx, 'up')}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === items.length - 1}
                              onClick={() => handleMove(idx, 'down')}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-400 ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Media Library Picker (5 cols) */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200">Kütüphaneden Medya Ekle</h4>
            {allMedia.length === 0 ? (
              <p className="text-xs text-slate-500">Medya kütüphanesinde henüz dosya yok.</p>
            ) : (
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {allMedia.map((media) => (
                  <div
                    key={media.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 hover:border-sky-500/50 transition group"
                  >
                    <div className="truncate mr-2">
                      <p className="text-xs font-medium text-slate-200 truncate">{media.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {media.type} • {media.duration} sn
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddMedia(media)}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-sky-600/20 text-sky-400 hover:bg-sky-600 hover:text-white transition shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      Ekle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2.5 bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Playlisti Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};
