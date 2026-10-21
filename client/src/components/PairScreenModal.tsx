import React, { useState } from 'react';
import { X, Tv, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScreenGroup } from '../types';

interface PairScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ScreenGroup[];
  onPair: (data: { pairingCode: string; name: string; groupId?: string }) => Promise<void>;
}

export const PairScreenModal: React.FC<PairScreenModalProps> = ({
  isOpen,
  onClose,
  groups,
  onPair
}) => {
  const [pairingCode, setPairingCode] = useState('');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim()) {
      setError('Lütfen TV ekranında görünen 6 haneli kodu giriniz.');
      return;
    }
    if (!name.trim()) {
      setError('Lütfen TV için açıklayıcı bir isim giriniz.');
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
      setPairingCode('');
      setName('');
      setGroupId('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Eşleştirme başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Yeni TV Eşleştir</h3>
              <p className="text-xs text-slate-400">TV ekranındaki 6 haneli kodu girin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/50 border border-red-800/60 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              6 Haneli Eşleştirme Kodu <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
              placeholder="Ör: A9K2X7"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center tracking-widest text-xl font-bold uppercase focus:outline-none focus:border-sky-500"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              TV tarayıcısında <span className="font-mono text-sky-400">/player</span> açıldığında görünen kod.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Ekran Adı / Konum <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ör: 3. Kat Asansör Holü TV"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Kat / Grup Ataması
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Grup Seçilmedi (Bağımsız) --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Eşleştiriliyor...' : 'Ekranı Eşleştir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
