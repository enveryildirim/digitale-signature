import React from 'react';
import { X, Tv } from 'lucide-react';
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
  if (!isOpen || !screen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Canlı Ekran Simülasyonu: {screen.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                {screen.group?.name || 'Bağımsız'} • {screen.status}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 16:9 TV Frame Container */}
        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl aspect-video bg-black rounded-xl border-4 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
            {screen.isPaired && screen.deviceToken ? (
              <iframe
                src={`/player?preview=true&token=${screen.deviceToken}`}
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
          <p className="text-[11px] text-slate-500 mt-3 text-center">
            TV'deki Chromium Kiosk oynatıcısının 16:9 canlı ekran görüntüsü.
          </p>
        </div>
      </div>
    </div>
  );
};
