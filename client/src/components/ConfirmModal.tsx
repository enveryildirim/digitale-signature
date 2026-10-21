import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
}

interface ConfirmModalProps {
  state: ConfirmModalState | null;
  onClose: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ state, onClose, loading = false }) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state?.isOpen) {
      // Focus safe "Vazgeç" button by default to prevent accidental Enter submit
      setTimeout(() => cancelBtnRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !loading) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [state?.isOpen, loading, onClose]);

  if (!state || !state.isOpen) return null;

  const isDestructive = state.isDestructive !== false;

  const handleConfirm = async () => {
    try {
      await state.onConfirm();
    } finally {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isDestructive
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <h3 id="confirm-modal-title" className="font-semibold text-white text-base">
              {state.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Kapat"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p id="confirm-modal-description" className="text-sm text-slate-300 leading-relaxed">
            {state.message}
          </p>
          {isDestructive && (
            <p className="text-xs text-rose-400/90 mt-3 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Bu işlem geri alınamaz veya bağlı ekranları doğrudan etkiler.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition active:scale-95 disabled:opacity-50 min-h-[40px]"
          >
            {state.cancelLabel || 'Vazgeç'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-50 min-h-[40px] flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
            }`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                İşlem Yapılıyor...
              </>
            ) : (
              state.confirmLabel || (isDestructive ? 'Evet, Kalıcı Olarak Sil' : 'Onayla')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

