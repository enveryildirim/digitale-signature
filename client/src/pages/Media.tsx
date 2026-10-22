import React, { useState, useMemo } from 'react';
import { Image, Plus, Trash2, Clock, Eye, Filter, Edit2 } from 'lucide-react';
import { Media as MediaType } from '../types';
import { MediaThumbnail } from '../components/MediaThumbnail';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterChips } from '../components/ui/FilterChips';

type TypeFilter = 'ALL' | MediaType['type'];

const TYPE_LABELS: Record<MediaType['type'], string> = {
  IMAGE: 'Görsel',
  VIDEO: 'Video',
  URL: 'Web'
};

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
  const [filterType, setFilterType] = useState<TypeFilter>('ALL');

  const countOf = (type: MediaType['type']) => mediaList.filter((m) => m.type === type).length;

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return mediaList.filter(
      (item) =>
        (filterType === 'ALL' || item.type === filterType) &&
        (!term || item.title.toLowerCase().includes(term))
    );
  }, [mediaList, filterType, searchTerm]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Medya</h2>
          <p className="text-sm text-slate-400 mt-1">Ekranlarda oynatılacak görsel, video ve web sayfaları</p>
        </div>
        <button onClick={onOpenUploadModal} className="btn-primary">
          <Plus className="w-4 h-4" />
          Medya ekle
        </button>
      </div>

      {mediaList.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Medya ara" />
          <FilterChips
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'ALL', label: 'Tümü', count: mediaList.length },
              { value: 'IMAGE', label: 'Görseller', count: countOf('IMAGE') },
              { value: 'VIDEO', label: 'Videolar', count: countOf('VIDEO') },
              { value: 'URL', label: 'Web sayfaları', count: countOf('URL') }
            ]}
          />
        </div>
      )}

      {mediaList.length === 0 ? (
        <EmptyState
          icon={Image}
          title="Medya kütüphanesi boş"
          description="Ekranlarda yayınlamak için ilk görselinizi, videonuzu veya web sayfanızı ekleyin."
        >
          <button onClick={onOpenUploadModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            İlk medyayı ekle
          </button>
        </EmptyState>
      ) : filteredList.length === 0 ? (
        <EmptyState icon={Filter} title="Aramaya uygun medya bulunamadı">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('ALL');
            }}
            className="btn-secondary"
          >
            Filtreleri temizle
          </button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredList.map((media) => (
            <div
              key={media.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-slate-700 transition group"
            >
              <div className="h-40 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                <MediaThumbnail media={media} />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-900/90 text-white border border-slate-700">
                  {TYPE_LABELS[media.type]}
                </span>
                <button
                  onClick={() => setPreviewMedia(media)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 flex items-center justify-center gap-1.5 text-sm font-semibold text-white transition"
                  aria-label={`${media.title} önizle`}
                >
                  <Eye className="w-4 h-4" />
                  Önizle
                </button>
              </div>

              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-semibold text-white text-sm truncate" title={media.title}>
                    {media.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {media.duration} sn
                    {media.fileSize ? ` · ${(media.fileSize / (1024 * 1024)).toFixed(1)} MB` : ''}
                  </p>
                </div>
                <div className="flex items-center shrink-0 -mr-1">
                  <button onClick={() => onEditMedia(media)} title="Düzenle" aria-label={`${media.title} düzenle`} className="btn-ghost">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteMedia(media.id)}
                    title="Sil"
                    aria-label={`${media.title} sil`}
                    className="btn-ghost hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={previewMedia !== null}
        onClose={() => setPreviewMedia(null)}
        size="xl"
        title={previewMedia?.title}
        subtitle={previewMedia ? TYPE_LABELS[previewMedia.type] : undefined}
        footer={
          <button
            onClick={() => {
              const toEdit = previewMedia!;
              setPreviewMedia(null);
              onEditMedia(toEdit);
            }}
            className="btn-secondary"
          >
            <Edit2 className="w-4 h-4" />
            Düzenle
          </button>
        }
      >
        {previewMedia && (
          <div className="bg-black flex items-center justify-center min-h-[350px]">
            {previewMedia.type === 'IMAGE' && (
              <img src={previewMedia.url} alt={previewMedia.title} className="max-h-[65vh] max-w-full object-contain" />
            )}
            {previewMedia.type === 'VIDEO' && (
              <video src={previewMedia.url} controls autoPlay className="max-h-[65vh] max-w-full" />
            )}
            {previewMedia.type === 'URL' && (
              <iframe src={previewMedia.url} title={previewMedia.title} className="w-full h-[60vh] border-none bg-white" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
