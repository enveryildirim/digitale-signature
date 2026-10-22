import React, { useState, useRef, useEffect } from 'react';
import { Edit3, AlertCircle, UploadCloud, FileVideo, FileImage, RefreshCw, Clock } from 'lucide-react';
import { Modal, ModalIcon } from './ui/Modal';
import { Media } from '../types';
import { MediaThumbnail } from './MediaThumbnail';

interface MediaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: Media | null;
  onUpdate: (id: string, data: { title?: string; duration?: number; url?: string } | FormData) => Promise<void>;
}

export const MediaEditModal: React.FC<MediaEditModalProps> = ({
  isOpen,
  onClose,
  media,
  onUpdate
}) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(10);
  const [url, setUrl] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isReplacingFile, setIsReplacingFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (media) {
      setTitle(media.title || '');
      setDuration(media.duration || 10);
      setUrl(media.url || '');
      setNewFile(null);
      setIsReplacingFile(false);
      setError(null);
    }
  }, [media, isOpen]);

  if (!isOpen || !media) return null;

  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

  const validateAndSetFile = (selected: File) => {
    if (selected.size > MAX_FILE_SIZE) {
      setError(`Seçtiğiniz dosya (${(selected.size / (1024 * 1024)).toFixed(1)} MB) 200 MB sınırını aşıyor. Lütfen daha küçük bir dosya seçin.`);
      return;
    }
    setError(null);
    setNewFile(selected);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Medya başlığı zorunludur.');
      return;
    }

    if (duration < 3 || duration > 3600) {
      setError('Gösterim süresi 3 ile 3600 saniye arasında olmalıdır.');
      return;
    }

    try {
      setLoading(true);

      if (isReplacingFile && newFile) {
        const formData = new FormData();
        formData.append('file', newFile);
        formData.append('title', title.trim());
        formData.append('duration', String(duration));
        await onUpdate(media.id, formData);
      } else if (media.type === 'URL') {
        if (!url.trim()) {
          setError('Web sayfası URL adresi zorunludur.');
          return;
        }
        await onUpdate(media.id, {
          title: title.trim(),
          url: url.trim(),
          duration: Number(duration)
        });
      } else {
        await onUpdate(media.id, {
          title: title.trim(),
          duration: Number(duration)
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Medya güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      busy={loading}
      size="md"
      icon={
        <ModalIcon tone="sky">
          <Edit3 className="w-5 h-5" />
        </ModalIcon>
      }
      title="Medyayı Güncelle"
      subtitle="Başlık, süre veya dosya/bağlantı içeriği"
    >

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/50 border border-rose-800/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Media Summary Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-16 h-16 bg-slate-900 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-800">
            <MediaThumbnail media={media} className="w-full h-full" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {media.type}
              </span>
              {media.fileSize && (
                <span className="text-[11px] text-slate-400 font-mono">
                  {(media.fileSize / (1024 * 1024)).toFixed(1)} MB
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-300 truncate" title={media.title}>
              {media.title}
            </p>
          </div>
        </div>

        {/* Title Field */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            İçerik Başlığı <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ör: Yemekhane Menüsü veya Hoş Geldiniz Panosu"
            className="input-standard"
            required
          />
        </div>

        {/* Duration Field */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Varsayılan Gösterim Süresi (Saniye)
            </span>
            <span className="text-[11px] text-slate-500">Min: 3 sn, Maks: 3600 sn</span>
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={3}
            max={3600}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="input-standard font-mono"
            required
          />
        </div>

        {/* URL specific field */}
        {media.type === 'URL' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Web Sayfası URL Adresi <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="input-standard font-mono text-xs"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              TV ekranında tam sayfa gösterilecek intranet veya web sayfası linki.
            </p>
          </div>
        )}

        {/* Replace file option for IMAGE & VIDEO */}
        {(media.type === 'IMAGE' || media.type === 'VIDEO') && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">Medya Dosyasını Değiştir</span>
              <button
                type="button"
                onClick={() => {
                  setIsReplacingFile(!isReplacingFile);
                  setNewFile(null);
                }}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {isReplacingFile ? 'Vazgeç (Eski Dosyayı Koru)' : 'Yeni Dosya Yükle'}
              </button>
            </div>

            {isReplacingFile && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-sky-500/40 hover:border-sky-500 rounded-xl p-5 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {newFile ? (
                  <div className="flex flex-col items-center">
                    {newFile.type.startsWith('video/') ? (
                      <FileVideo className="w-8 h-8 text-sky-400 mb-1.5" />
                    ) : (
                      <FileImage className="w-8 h-8 text-emerald-400 mb-1.5" />
                    )}
                    <span className="text-xs font-semibold text-white">{newFile.name}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {(newFile.size / (1024 * 1024)).toFixed(2)} MB • Başka dosya seçmek için tıklayın
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-8 h-8 text-sky-400 mb-1.5" />
                    <span className="text-xs font-medium text-slate-200">
                      Yeni dosyayı buraya sürükleyin veya <span className="text-sky-400 font-semibold">seçin</span>
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Maksimum dosya boyutu: 200 MB
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              'Değişiklikleri Kaydet'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

