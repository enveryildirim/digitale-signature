import React, { useState } from 'react';
import { Image, FileVideo, Globe, Plus, Trash2, Clock, Eye, X } from 'lucide-react';
import { Media as MediaType } from '../types';

interface MediaProps {
  mediaList: MediaType[];
  onOpenUploadModal: () => void;
  onDeleteMedia: (id: string) => Promise<void>;
}

export const Media: React.FC<MediaProps> = ({
  mediaList,
  onOpenUploadModal,
  onDeleteMedia
}) => {
  const [previewMedia, setPreviewMedia] = useState<MediaType | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Medya Kütüphanesi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Görseller, videolar ve kurum içi web sayfalarını yönetin
          </p>
        </div>
        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow-md shadow-sky-600/30"
        >
          <Plus className="w-4 h-4" />
          Medya Yükle / Ekle
        </button>
      </div>

      {mediaList.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <Image className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">Medya Kütüphanesi Boş</h4>
          <p className="text-xs text-slate-500 mt-1">
            Ekranlarda oynatmak için görsel, video veya web sayfası ekleyin.
          </p>
          <button
            onClick={onOpenUploadModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition"
          >
            <Plus className="w-4 h-4" />
            İlk Medyayı Yükle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaList.map((media) => {
            return (
              <div
                key={media.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition group shadow-lg"
              >
                {/* Media Thumbnail / Preview Container */}
                <div className="h-44 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                  {media.type === 'IMAGE' ? (
                    <img
                      src={media.url}
                      alt={media.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : media.type === 'VIDEO' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 group-hover:text-sky-400 transition bg-slate-950">
                      <FileVideo className="w-12 h-12 mb-2" />
                      <span className="text-[11px] font-medium text-slate-400">Video İçeriği</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 group-hover:text-emerald-400 transition bg-slate-950 p-4 text-center">
                      <Globe className="w-12 h-12 mb-2" />
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-full">
                        {media.url}
                      </span>
                    </div>
                  )}

                  {/* Type Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-white border border-slate-700 backdrop-blur-sm">
                    {media.type}
                  </span>

                  {/* Hover Quick Preview Button */}
                  <button
                    onClick={() => setPreviewMedia(media)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200 text-white gap-1.5 text-xs font-semibold backdrop-blur-[2px]"
                  >
                    <Eye className="w-4 h-4" />
                    Önizle
                  </button>
                </div>

                {/* Details Footer */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-white text-xs truncate" title={media.title}>
                      {media.title}
                    </h4>
                    <button
                      onClick={() => onDeleteMedia(media.id)}
                      title="Medyayı Sil"
                      className="text-slate-500 hover:text-red-400 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {media.duration} sn
                    </span>
                    {media.fileSize && (
                      <span>{(media.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="font-semibold text-white text-sm truncate mr-4">
                {previewMedia.title}
              </span>
              <button
                onClick={() => setPreviewMedia(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
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
