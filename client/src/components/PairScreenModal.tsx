import React, { useState, useEffect } from 'react';
import { X, Tv, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { ScreenGroup } from '../types';

interface PairScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ScreenGroup[];
  initialPairingCode?: string;
  onPair: (data: { pairingCode: string; name: string; groupId?: string }) => Promise<void>;
}

export const PairScreenModal: React.FC<PairScreenModalProps> = ({
  isOpen,
  onClose,
  groups,
  initialPairingCode = '',
  onPair
}) => {
  const [pairingCode, setPairingCode] = useState(initialPairingCode);
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPairingCode(initialPairingCode || '');
      setName('');
      setGroupId('');
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, initialPairingCode]);

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

  if (!isOpen) return null;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric, auto-capitalize, limit to 6 chars (UX-3.1 & UX-3.6)
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setPairingCode(sanitized);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pairingCode.trim().length !== 6) {
      setError('Lütfen TV ekranında görünen 6 haneli kodu eksiksiz giriniz.');
      return;
    }
    if (!name.trim()) {
      setError('Lütfen TV ekranı için açıklayıcı bir konum veya isim giriniz.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onPair({
        pairingCode: pairingCode.trim().toUpperCase(),
        name: name.trim(),
        groupId: groupId || undefined
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Eşleştirme başarısız oldu. Lütfen kodu ve bağlantıyı kontrol edin.');
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Yeni TV Eşleştir</h3>
              <p className="text-xs text-slate-400">TV ekranındaki 6 haneli kodu sisteme tanıtın</p>
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

        {isSuccess ? (
          /* Success feedback (UX-7.2) */
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">TV Başarıyla Eşleştirildi!</h4>
            <p className="text-xs text-slate-300">Yayın sinyali ekrana gönderiliyor...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/50 border border-rose-800/60 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  6 Haneli Eşleştirme Kodu <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] font-mono font-semibold text-slate-400">
                  {pairingCode.length}/6 Karakter
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={pairingCode}
                  onChange={handleCodeChange}
                  placeholder="Ör: A9K2X7"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center tracking-[0.35em] text-2xl font-bold uppercase focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-inner"
                  autoFocus
                />
                {pairingCode.length === 6 && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                TV tarayıcısında <span className="font-mono text-sky-400">/player</span> açıldığında ekranda görünen kod.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Ekran Adı / Konum <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ör: 3. Kat Asansör Holü TV"
                className="input-standard"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Kat / Grup Ataması (İsteğe bağlı)
              </label>
              <div className="relative">
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="input-standard appearance-none pr-8 cursor-pointer"
                >
                  <option value="">-- Grup Seçilmedi (Bağımsız TV) --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Bir kat grubu seçerseniz TV, o katın varsayılan yayınını otomatik olarak miras alır.
              </p>
            </div>

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
                disabled={loading || pairingCode.length !== 6 || !name.trim()}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Bağlanıyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    TV Ekranını Sisteme Bağla
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
