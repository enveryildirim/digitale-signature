import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Modal, ModalIcon } from './ui/Modal';

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
    <Modal
      isOpen
      onClose={onClose}
      busy={loading}
      size="md"
      icon={
        <ModalIcon tone="rose">
          <ShieldAlert className="w-5 h-5" />
        </ModalIcon>
      }
      title="Acil Durum Yayını"
      subtitle="Kurumdaki tüm TV ekranları"
    >

      <form onSubmit={handleToggle} className="p-5 space-y-4">
        <p className="text-xs text-slate-300 leading-relaxed">
          {isActive ? (
            <span className="text-rose-400 font-semibold block">
              🚨 Şu anda tüm TV ekranlarında Acil Durum yayını basılı durumdadır!
            </span>
          ) : (
            'Bu işlem tek tıkla kurumdaki tüm 10 TV ekranında oynatılan normal içeriği durdurur ve anında kırmızı acil durum ekranına geçirir.'
          )}
        </p>

        {!isActive ? (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Duyuru Başlığı</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-standard font-bold text-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Açıklama / Yönerge</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed"
              />
            </div>
          </>
        ) : (
          <div className="p-5 bg-rose-950/60 border border-rose-800 rounded-xl text-center space-y-2">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-white">Acil Yayın Canlıda Aktif</p>
            <p className="text-xs text-rose-300 leading-relaxed">
              Normal yayın akışına geri dönmek için aşağıdaki butona basın.
            </p>
          </div>
        )}

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
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50 min-h-[40px] flex items-center gap-2 ${
              isActive
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
            }`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                İşleniyor...
              </>
            ) : isActive ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Acil Durum Yayınını Kaldır (Normale Dön)
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                Tüm TV'lerde Acil Yayını Başlat
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
