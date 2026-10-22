import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
} as const;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: keyof typeof SIZE_CLASSES;
  /** Disables Esc / close button while an async action is running */
  busy?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared modal shell: backdrop, header, Esc-to-close, optional sticky footer.
 * Body scrolls when content exceeds 90vh.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  busy = false,
  footer,
  children
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl w-full ${SIZE_CLASSES[size]} max-h-[90vh] flex flex-col overflow-hidden shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h3 id={titleId} className="font-semibold text-white text-base truncate">
                {title}
              </h3>
              {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Kapat"
            className="btn-ghost shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 bg-slate-950/60 border-t border-slate-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/** Colored square icon used in modal headers */
export const ModalIcon: React.FC<{ tone: 'sky' | 'emerald' | 'purple' | 'amber' | 'rose'; children: React.ReactNode }> = ({
  tone,
  children
}) => {
  const tones = {
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };
  return <div className={`p-2.5 rounded-xl border ${tones[tone]}`}>{children}</div>;
};
