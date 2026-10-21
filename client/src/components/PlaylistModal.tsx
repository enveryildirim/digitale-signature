import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Clock, AlertCircle, Search, Layers, CheckCircle2 } from 'lucide-react';
import { Media, Playlist } from '../types';
import { MediaThumbnail } from './MediaThumbnail';

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
  const [mediaSearchTerm, setMediaSearchTerm] = useState('');
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
    setMediaSearchTerm('');
    setError(null);
  }, [playlist, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, loading, onClose]);

  const filteredMediaList = useMemo(() => {
    if (!mediaSearchTerm.trim()) return allMedia;
    const term = mediaSearchTerm.toLowerCase();
    return allMedia.filter(
      (m) => m.title.toLowerCase().includes(term) || m.type.toLowerCase().includes(term)
    );
  }, [allMedia, mediaSearchTerm]);

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
    if (error) setError(null);
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
      next[index] = { ...next[index], duration: Math.max(3, Math.min(3600, duration || 3)) };
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
      setError('Lütfen oynatma listesi için açıklayıcı bir ad giriniz.');
      return;
    }
    if (items.length === 0) {
      setError('Lütfen sağdaki medya kütüphanesinden listeye en az bir içerik ekleyiniz.');
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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                {playlist ? 'Oynatma Listesini Düzenle' : 'Yeni Oynatma Listesi Oluştur'}
              </h3>
              <p className="text-xs text-slate-400">İçeriklerin sırasını ve gösterim sürelerini yapılandırın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & Playlist Items (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/50 border border-rose-800/60 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Oynatma Listesi Adı <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ör: Zemin Kat Genel Tanıtım Akışı"
                className="input-standard"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Açıklama (İsteğe bağlı)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ör: Mesai saatleri boyunca döngüde kalacak duyurular"
                className="input-standard"
              />
            </div>

            {/* Selected Items */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Yayın Akış Sırası ({items.length} Öğe)
                </span>
                <span className="text-xs text-sky-400 flex items-center gap-1.5 font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Toplam Döngü: {formatTotalTime(totalSeconds)}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-950/30">
                  <p className="text-xs font-medium text-slate-400">Henüz listeye medya eklenmedi.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sağdaki kütüphaneden dosya seçerek <strong>"+ Ekle"</strong> butonuna tıklayın.
                  </p>
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
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="w-5 text-center text-xs font-mono font-bold text-slate-500 shrink-0">
                            {idx + 1}
                          </span>
                          {media && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                              <MediaThumbnail media={media} className="w-full h-full" />
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-xs font-medium text-white truncate max-w-[150px] sm:max-w-[190px]">
                              {media?.title || 'Medya Dosyası'}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {media?.type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Duration input */}
                          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                            <input
                              type="number"
                              min={3}
                              max={3600}
                              value={item.duration}
                              onChange={(e) => handleDurationChange(idx, Number(e.target.value))}
                              className="w-12 bg-transparent text-right text-xs text-sky-400 font-mono font-bold focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500 font-mono">sn</span>
                          </div>

                          {/* Reordering and remove controls */}
                          <div className="flex items-center">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMove(idx, 'up')}
                              aria-label="Yukarı taşı"
                              className="btn-ghost p-1 disabled:opacity-20"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === items.length - 1}
                              onClick={() => handleMove(idx, 'down')}
                              aria-label="Aşağı taşı"
                              className="btn-ghost p-1 disabled:opacity-20"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              aria-label="Listeden kaldır"
                              className="btn-ghost p-1 text-slate-400 hover:text-rose-400 ml-1"
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

          {/* Right Column: Media Library Picker (5 cols) (UX-2.3) */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-200">Kütüphaneden Medya Seç</h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {filteredMediaList.length} / {allMedia.length} Medya
              </span>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={mediaSearchTerm}
                onChange={(e) => setMediaSearchTerm(e.target.value)}
                placeholder="Medya ara..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              {mediaSearchTerm && (
                <button
                  type="button"
                  onClick={() => setMediaSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {allMedia.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">Medya kütüphanesinde henüz dosya yok.</p>
            ) : filteredMediaList.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">Aramanıza uygun medya bulunamadı.</p>
            ) : (
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredMediaList.map((media) => (
                  <div
                    key={media.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/50 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 mr-2">
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                        <MediaThumbnail media={media} className="w-full h-full" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-200 truncate">{media.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {media.type} • {media.duration} sn
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddMedia(media)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600/20 text-sky-300 hover:bg-sky-600 hover:text-white transition shrink-0 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ekle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Oynatma Listesini Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
