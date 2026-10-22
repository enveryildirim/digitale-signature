import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal, ModalIcon } from './ui/Modal';

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
    // Focus safe "Vazgeç" button by default to prevent accidental Enter submit
    if (state?.isOpen) setTimeout(() => cancelBtnRef.current?.focus(), 50);
  }, [state?.isOpen]);

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
    <Modal
      isOpen
      onClose={onClose}
      busy={loading}
      size="sm"
      icon={
        <ModalIcon tone={isDestructive ? 'rose' : 'amber'}>
          {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </ModalIcon>
      }
      title={state.title}
      footer={
        <>
          <button ref={cancelBtnRef} type="button" onClick={onClose} disabled={loading} className="btn-secondary">
            {state.cancelLabel || 'Vazgeç'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`btn-primary ${isDestructive ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : ''}`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                İşlem yapılıyor...
              </>
            ) : (
              state.confirmLabel || (isDestructive ? 'Evet, kalıcı olarak sil' : 'Onayla')
            )}
          </button>
        </>
      }
    >
      <div className="p-5">
        <p className="text-sm text-slate-300 leading-relaxed">{state.message}</p>
        {isDestructive && (
          <p className="text-xs text-rose-400/90 mt-3 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Bu işlem geri alınamaz veya bağlı ekranları doğrudan etkiler.
          </p>
        )}
      </div>
    </Modal>
  );
};
