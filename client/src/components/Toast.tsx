import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, RotateCcw } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id?: string;
  message: string;
  description?: string;
  type?: ToastType;
  duration?: number; // ms, default 5000
  undoAction?: {
    label?: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const duration = toast.duration || (toast.undoAction ? 6000 : 4000);
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || 'success';

  const typeStyles = {
    success: {
      bg: 'bg-slate-900 border-emerald-500/40 text-emerald-400',
      progressBar: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
    },
    error: {
      bg: 'bg-slate-900 border-rose-500/40 text-rose-400',
      progressBar: 'bg-rose-500',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
    },
    warning: {
      bg: 'bg-slate-900 border-amber-500/40 text-amber-400',
      progressBar: 'bg-amber-500',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
    },
    info: {
      bg: 'bg-slate-900 border-sky-500/40 text-sky-400',
      progressBar: 'bg-sky-500',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />
    }
  };

  const style = typeStyles[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-200"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border shadow-2xl p-4 bg-slate-900/95 backdrop-blur-md ${style.bg} border`}
      >
        <div className="flex items-start gap-3.5">
          <div className="pt-0.5">{style.icon}</div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-sm font-semibold text-white tracking-wide leading-snug">
              {toast.message}
            </p>
            {toast.description && (
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {toast.description}
              </p>
            )}

            {/* Undo action button */}
            {toast.undoAction && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    toast.undoAction?.onClick();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 hover:text-white border border-sky-500/30 transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {toast.undoAction.label || 'Geri Al (Undo)'}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Bildirimi Kapat"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Countdown Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className={`h-full transition-all duration-75 ${style.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

