import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Image, Plus, Trash2, Clock, Eye, X, Search, Filter, Edit2 } from 'lucide-react';
import { Media as MediaType } from '../types';
import { MediaThumbnail } from '../components/MediaThumbnail';

interface MediaProps {
  mediaList: MediaType[];
  onOpenUploadModal: () => void;
  onEditMedia: (media: MediaType) => void;
  onDeleteMedia: (id: string) => Promise<void>;
}

export const Media: React.FC<MediaProps> = ({
  mediaList,
  onOpenUploadModal,
  onEditMedia,
  onDeleteMedia
}) => {
  const [previewMedia, setPreviewMedia] = useState<MediaType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'URL'>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && previewMedia) {
        setPreviewMedia(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMedia]);

  // Counts for dynamic filter badges (UX-2.4)
  const counts = useMemo(() => {
    return {
      all: mediaList.length,
      image: mediaList.filter((m) => m.type === 'IMAGE').length,
      video: mediaList.filter((m) => m.type === 'VIDEO').length,
      url: mediaList.filter((m) => m.type === 'URL').length
    };
  }, [mediaList]);

  // Filtered and searched media
  const filteredList = useMemo(() => {
    return mediaList.filter((item) => {
      const matchesType = filterType === 'ALL' || item.type === filterType;
      const matchesSearch =
        searchTerm.trim() === '' ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [mediaList, filterType, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Medya Kütüphanesi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ekranlarda oynatılacak görsel, video ve kurum içi web sayfalarını yönetin
          </p>
        </div>
        <button
          onClick={onOpenUploadModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Medyayı Kütüphaneye Yükle
        </button>
      </div>

      {/* Search and Dynamic Filter Bar (UX-2.3 & UX-2.4) */}
      {mediaList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Medya başlığına göre ara... (/)"
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

          {/* Dynamic Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                filterType === 'ALL'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tümü ({counts.all})
            </button>
            <button
              onClick={() => setFilterType('IMAGE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                filterType === 'IMAGE'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Görseller ({counts.image})
            </button>
            <button
              onClick={() => setFilterType('VIDEO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                filterType === 'VIDEO'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Videolar ({counts.video})
            </button>
            <button
              onClick={() => setFilterType('URL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                filterType === 'URL'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Web Sayfaları ({counts.url})
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {mediaList.length === 0 ? (
        /* Empty State: Initial Zero State */
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <Image className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-200">Medya Kütüphanesi Henüz Boş</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            TV ekranlarında ve oynatma listelerinde yayınlamak için ilk görselinizi, videonuzu veya kurum içi web sayfanızı yükleyin.
          </p>
          <button
            onClick={onOpenUploadModal}
            className="mt-5 btn-primary"
          >
            <Plus className="w-4 h-4" />
            İlk Medyayı Kütüphaneye Yükle
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        /* Empty State: Search / Filter No Results (UX-2.5) */
        <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center bg-slate-900/40">
          <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-200">Arama Kriterine Uygun Medya Bulunamadı</h4>
          <p className="text-xs text-slate-400 mt-1">
            "{searchTerm}" aramasına veya seçili filtreye ait dosya bulunmuyor.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('ALL');
              }}
              className="btn-secondary"
            >
              Filtreleri Temizle
            </button>
            <button
              onClick={onOpenUploadModal}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Yeni Medya Yükle
            </button>
          </div>
        </div>
      ) : (
        /* Media Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredList.map((media) => {
            return (
              <div
                key={media.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition group shadow-lg"
              >
                {/* Media Thumbnail / Preview Container */}
                <div className="h-44 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                  <MediaThumbnail media={media} />

                  {/* Type Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-white border border-slate-700 backdrop-blur-sm shadow z-10 pointer-events-none">
                    {media.type}
                  </span>

                  {/* Hover Quick Preview Button */}
                  <button
                    onClick={() => setPreviewMedia(media)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200 text-white gap-1.5 text-xs font-semibold backdrop-blur-[2px] z-10"
                    aria-label={`${media.title} medyasını tam ekran önizle`}
                  >
                    <Eye className="w-4 h-4" />
                    Önizle
                  </button>
                </div>

                {/* Details Footer */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-white text-xs truncate" title={media.title}>
                      {media.title}
                    </h4>
                    <div className="flex items-center gap-1 -mr-1.5 -mt-1.5 shrink-0">
                      <button
                        onClick={() => onEditMedia(media)}
                        title="Medyayı Düzenle"
                        aria-label={`${media.title} medyasını düzenle`}
                        className="btn-ghost text-slate-400 hover:text-sky-400 p-1 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMedia(media.id)}
                        title="Medyayı Kalıcı Olarak Sil"
                        aria-label={`${media.title} medyasını sil`}
                        className="btn-ghost text-slate-400 hover:text-rose-400 p-1 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {media.duration} sn
                    </span>
                    {media.fileSize && (
                      <span className="font-mono">{(media.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {previewMedia.type}
                </span>
                <span className="font-semibold text-white text-sm truncate mr-4">
                  {previewMedia.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = previewMedia;
                    setPreviewMedia(null);
                    onEditMedia(toEdit);
                  }}
                  className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1.5"
                  title="Medyayı Düzenle"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Düzenle</span>
                </button>
                <button
                  onClick={() => setPreviewMedia(null)}
                  aria-label="Önizlemeyi Kapat"
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-black flex items-center justify-center min-h-[350px] max-h-[70vh]">
              {previewMedia.type === 'IMAGE' && (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  className="max-h-[65vh] max-w-full object-contain"
                />
              )}
              {previewMedia.type === 'VIDEO' && (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  className="max-h-[65vh] max-w-full"
                />
              )}
              {previewMedia.type === 'URL' && (
                <iframe
                  src={previewMedia.url}
                  title={previewMedia.title}
                  className="w-full h-[500px] border-none bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
