import React, { useState, useRef } from 'react';
import { X, UploadCloud, Globe, AlertCircle, FileVideo, FileImage, Type } from 'lucide-react';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (formData: FormData) => Promise<void>;
  onAddUrl: (data: { title: string; url: string; duration?: number }) => Promise<void>;
  onAddTextAnnouncement?: (data: { title: string; message: string; bgColor?: string; textColor?: string; duration?: number }) => Promise<void>;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  onAddUrl,
  onAddTextAnnouncement
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [bgColor, setBgColor] = useState('#0f172a');
  const [duration, setDuration] = useState(10);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
      if (selected.type.startsWith('video/')) {
        setDuration(15);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      if (activeTab === 'file') {
        if (!file) {
          setError('Lütfen yüklenecek bir görsel veya video dosyası seçin.');
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title || file.name);
        formData.append('duration', String(duration));
        await onUploadFile(formData);
      } else if (activeTab === 'url') {
        if (!title.trim() || !url.trim()) {
          setError('Başlık ve geçerli bir URL zorunludur.');
          return;
        }
        await onAddUrl({
          title: title.trim(),
          url: url.trim(),
          duration: Number(duration) || 15
        });
      } else if (activeTab === 'text') {
        if (!title.trim() || !message.trim()) {
          setError('Duyuru başlığı ve açıklama metni zorunludur.');
          return;
        }
        if (onAddTextAnnouncement) {
          await onAddTextAnnouncement({
            title: title.trim(),
            message: message.trim(),
            bgColor,
            duration: Number(duration) || 12
          });
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Yükleme başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-base">Medya Kütüphanesine Ekle</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-5 pt-2">
          <button
            type="button"
            onClick={() => { setActiveTab('file'); setError(null); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition ${
              activeTab === 'file'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Dosya Yükle
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('url'); setError(null); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition ${
              activeTab === 'url'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Web Sayfası (URL)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('text'); setError(null); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition ${
              activeTab === 'text'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-4 h-4" />
            Metin Duyurusu
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/50 border border-red-800/60 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'file' && (
            <div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center">
                    {file.type.startsWith('video/') ? (
                      <FileVideo className="w-10 h-10 text-sky-400 mb-2" />
                    ) : (
                      <FileImage className="w-10 h-10 text-emerald-400 mb-2" />
                    )}
                    <span className="text-sm font-medium text-white">{file.name}</span>
                    <span className="text-xs text-slate-400 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Değiştirmek için tıklayın
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-200">
                      Dosyayı buraya sürükleyin veya <span className="text-sky-400">göz atın</span>
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Desteklenen: JPG, PNG, WebP, MP4 (Maks: 200 MB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Web Sayfası URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://kurum-panosu.yerel.local"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Duyuru Metni / Mesaj <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Yarın saat 14:00'te ana konferans salonunda genel bilgilendirme toplantısı yapılacaktır."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Arka Plan Rengi
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#0f172a', name: 'Kurumsal Koyu' },
                    { color: '#1e3a8a', name: 'Mavi' },
                    { color: '#064e3b', name: 'Yeşil' },
                    { color: '#701a75', name: 'Mor' },
                    { color: '#881337', name: 'Bordo' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setBgColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        bgColor === c.color ? 'border-sky-400 scale-110 shadow-lg' : 'border-slate-700'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              İçerik Başlığı <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ör: Kurum Tanıtım Videosu veya Genel Duyuru"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Varsayılan Gösterim Süresi (Saniye)
            </label>
            <input
              type="number"
              min={3}
              max={3600}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition disabled:opacity-50"
            >
              {loading ? 'Yükleniyor...' : 'Kütüphaneye Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
