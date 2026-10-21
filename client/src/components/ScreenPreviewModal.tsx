import React, { useEffect } from 'react';
import { X, Tv, Radio } from 'lucide-react';
import { Screen } from '../types';

interface ScreenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  screen: Screen | null;
}

export const ScreenPreviewModal: React.FC<ScreenPreviewModalProps> = ({
  isOpen,
  onClose,
  screen
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !screen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">
                  {screen.name}
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Canlı TV Senkronizasyonu
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {screen.group?.name || 'Bağımsız TV'} • Durum: {screen.status === 'ONLINE' ? 'Çevrimiçi' : 'Çevrimdışı'}
                {screen.currentMedia && ` • Oynatılan: ${screen.currentMedia}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Önizlemeyi Kapat"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 16:9 TV Frame Container */}
        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl aspect-video bg-black rounded-xl border-4 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
            {screen.isPaired && screen.deviceToken ? (
              <iframe
                src={`/player?preview=true&token=${screen.deviceToken}&_t=${Date.now()}`}
                title={`Preview ${screen.name}`}
                className="w-full h-full border-none pointer-events-none"
              />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <Tv className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-300">Ekran Henüz Eşleşmedi</p>
                <p className="text-xs text-amber-400 font-mono font-bold mt-1">
                  Eşleştirme Kodu: {screen.pairingCode || '------'}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400 text-center">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span>Fiziksel TV ekranı ile eşzamanlı canlı akış gösterilmektedir (Baştan başlatılmaz).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
