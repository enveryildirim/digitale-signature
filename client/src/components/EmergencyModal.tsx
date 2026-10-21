import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  onActivate: (title: string, message: string) => Promise<void>;
  onDeactivate: () => Promise<void>;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  isActive,
  onActivate,
  onDeactivate
}) => {
  const [title, setTitle] = useState('ACİL DURUM BİLDİRİMİ');
  const [message, setMessage] = useState('Binayı lütfen acil çıkış kapılarını kullanarak derhal boşaltınız.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isActive) {
        await onDeactivate();
      } else {
        await onActivate(title, message);
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-red-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-red-900/50 bg-red-950/40">
          <div className="flex items-center gap-2.5 text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <h3 className="font-bold text-white text-base">Acil Durum Yayını (Tüm TV'ler)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleToggle} className="p-5 space-y-4">
          <p className="text-xs text-slate-300">
            {isActive ? (
              <span className="text-red-400 font-semibold">
                Şu anda tüm TV ekranlarında Acil Durum yayını basılı durumdadır!
              </span>
            ) : (
              'Bu işlem tek tıkla kurumdaki tüm 10 TV ekranında oynatılan içeriği durdurur ve kırmızı acil durum ekranına geçirir.'
            )}
          </p>

          {!isActive ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Duyuru Başlığı</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Açıklama / Yönerge</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </>
          ) : (
            <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-bold text-white">Yayın Aktif</p>
              <p className="text-xs text-red-300 mt-1">Normal yayına dönmek için aşağıdaki butona basın.</p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition ${
                isActive
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/40'
              }`}
            >
              {isActive ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Acil Durumu Sonlandır (Normal Yayına Dön)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Tüm TV'lere Acil Anons Bas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

