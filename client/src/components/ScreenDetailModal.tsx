import React, { useEffect, useMemo, useState } from 'react';
import { Tv, Copy, Check, ExternalLink, RefreshCw, Unlink, Trash2 } from 'lucide-react';
import { Screen, ScreenGroup } from '../types';
import { Modal, ModalIcon } from './ui/Modal';
import { formatLastSeen } from '../utils/format';

interface ScreenDetailModalProps {
  screen: Screen | null;
  groups: ScreenGroup[];
  onClose: () => void;
  onUpdate: (id: string, data: { name?: string; groupId?: string | null }) => Promise<void>;
  onSync: (id: string) => void;
  onUnpair: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Single place for everything about one TV: live preview, name/floor,
 * persistent player link, device info and destructive actions.
 */
export const ScreenDetailModal: React.FC<ScreenDetailModalProps> = ({
  screen,
  groups,
  onClose,
  onUpdate,
  onSync,
  onUnpair,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset form only when a different TV is opened (not on every 10s data refresh)
  useEffect(() => {
    if (screen) {
      setName(screen.name);
      setGroupId(screen.groupId || '');
      setCopied(false);
    }
  }, [screen?.id]);

  const playerLink = screen?.deviceToken
    ? `${window.location.origin}/player/?token=${encodeURIComponent(screen.deviceToken)}`
    : null;

  // Stable src so the preview does not restart on every parent re-render
  const previewSrc = useMemo(
    () => (screen?.deviceToken ? `/player/?preview=true&token=${screen.deviceToken}&_t=${Date.now()}` : null),
    [screen?.id, screen?.deviceToken]
  );

  if (!screen) return null;

  const isDirty = name.trim() !== screen.name || (groupId || null) !== (screen.groupId || null);
  const isOnline = screen.status === 'ONLINE';

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(screen.id, { name: name.trim() || screen.name, groupId: groupId || null });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!playerLink) return;
    navigator.clipboard.writeText(playerLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      busy={saving}
      size="lg"
      icon={
        <ModalIcon tone="sky">
          <Tv className="w-5 h-5" />
        </ModalIcon>
      }
      title={screen.name}
      subtitle={`${screen.group?.name || 'Kat atanmamış'} · ${isOnline ? 'Çevrimiçi' : `Çevrimdışı · son sinyal ${formatLastSeen(screen.lastSeen)}`}`}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">
            Kapat
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !isDirty || !name.trim()} className="btn-primary">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </>
      }
    >
      <div className="p-5 space-y-5">
        {/* Live preview (simulates exactly what the physical TV is showing) */}
        <div>
          <div className="aspect-video bg-black rounded-xl border-2 border-slate-800 overflow-hidden">
            {previewSrc && (
              <iframe
                src={previewSrc}
                title={`${screen.name} canlı önizleme`}
                className="w-full h-full border-none pointer-events-none"
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
            <span>Fiziksel TV ile eşzamanlı önizleme</span>
            <button type="button" onClick={() => onSync(screen.id)} className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300">
              <RefreshCw className="w-3.5 h-3.5" />
              TV'de yayını yenile
            </button>
          </div>
        </div>

        {/* Name & floor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="screen-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Ekran adı
            </label>
            <input
              id="screen-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ör: Danışma Giriş TV"
              className="input-standard"
            />
          </div>
          <div>
            <label htmlFor="screen-group" className="block text-sm font-medium text-slate-300 mb-1.5">
              Kat
            </label>
            <select id="screen-group" value={groupId} onChange={(e) => setGroupId(e.target.value)} className="input-standard">
              <option value="">Kat atanmamış</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Persistent player link */}
        {playerLink && (
          <div>
            <span className="block text-sm font-medium text-slate-300 mb-1.5">Kalıcı TV bağlantısı</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={playerLink}
                onFocus={(e) => e.target.select()}
                className="input-standard py-2 text-xs font-mono"
              />
              <button type="button" onClick={handleCopy} className="btn-secondary shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
              <a href={playerLink} target="_blank" rel="noreferrer" className="btn-ghost shrink-0" title="Yeni sekmede aç">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              TV tarayıcısı bu adresle açılırsa sekme kapansa bile hep bu ekran olarak bağlanır.
            </p>
          </div>
        )}

        {/* Device info */}
        <dl className="grid grid-cols-3 gap-3 text-xs bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div>
            <dt className="text-slate-500">IP adresi</dt>
            <dd className="text-slate-200 font-mono mt-0.5">{screen.ipAddress || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Player sürümü</dt>
            <dd className="text-slate-200 font-mono mt-0.5">{screen.playerVersion || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Son sinyal</dt>
            <dd className="text-slate-200 font-mono mt-0.5">{formatLastSeen(screen.lastSeen)}</dd>
          </div>
        </dl>

        {/* Destructive actions */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onUnpair(screen.id);
            }}
            className="btn-secondary text-amber-400"
          >
            <Unlink className="w-4 h-4" />
            Eşleştirmeyi sıfırla
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(screen.id);
            }}
            className="btn-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Ekranı sil
          </button>
        </div>
      </div>
    </Modal>
  );
};
