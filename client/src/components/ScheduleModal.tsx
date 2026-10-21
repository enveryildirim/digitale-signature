import React, { useState, useEffect } from 'react';
import { X, CalendarClock, AlertCircle, CheckCircle2, Building2, Tv } from 'lucide-react';
import { Playlist, Screen, ScreenGroup } from '../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  screens: Screen[];
  groups: ScreenGroup[];
  onSave: (data: any) => Promise<void>;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  playlists,
  screens,
  groups,
  onSave
}) => {
  const [playlistId, setPlaylistId] = useState('');
  const [targetType, setTargetType] = useState<'group' | 'screen'>('group');
  const [targetId, setTargetId] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const daysList = [
    { num: 1, label: 'Pzt' },
    { num: 2, label: 'Sal' },
    { num: 3, label: 'Çar' },
    { num: 4, label: 'Per' },
    { num: 5, label: 'Cum' },
    { num: 6, label: 'Cmt' },
    { num: 7, label: 'Paz' },
  ];

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistId) {
      setError('Lütfen yayınlanacak bir oynatma listesi seçiniz.');
      return;
    }
    if (!targetId) {
      setError('Lütfen hedef kat/grup veya TV ekranı seçiniz.');
      return;
    }
    if (!isDefault) {
      if (selectedDays.length === 0) {
        setError('Zamanlanmış yayın için lütfen en az bir aktif gün seçiniz.');
        return;
      }
      if (startTime >= endTime) {
        setError('Bitiş saati başlangıç saatinden sonra olmalıdır.');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        playlistId,
        screenId: targetType === 'screen' ? targetId : null,
        groupId: targetType === 'group' ? targetId : null,
        isDefault,
        startTime: isDefault ? null : startTime,
        endTime: isDefault ? null : endTime,
        daysOfWeek: isDefault ? null : selectedDays.join(','),
        priority: isDefault ? 1 : 5
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Yayın planı kaydedilemedi.');
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Yayın Planı Oluştur</h3>
              <p className="text-xs text-slate-400">Oynatma listesini TV ekranına veya kata zamanlayın</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/50 border border-rose-800/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Playlist Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Yayınlanacak Oynatma Listesi <span className="text-rose-400">*</span>
            </label>
            <select
              value={playlistId}
              onChange={(e) => {
                setPlaylistId(e.target.value);
                if (error) setError(null);
              }}
              className="input-standard cursor-pointer"
            >
              <option value="">-- Oynatma Listesi Seçin --</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} ({pl.items?.length || 0} İçerik)
                </option>
              ))}
            </select>
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Hedef Kapsamı</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => { setTargetType('group'); setTargetId(''); }}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  targetType === 'group'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 shadow-sm'
                    : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Kat / Grup Bazında
              </button>
              <button
                type="button"
                onClick={() => { setTargetType('screen'); setTargetId(''); }}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  targetType === 'screen'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 shadow-sm'
                    : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                Belirli Bir TV Ekranı
              </button>
            </div>
          </div>

          {/* Target ID Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {targetType === 'group' ? 'Hedef Kat / Grup' : 'Hedef TV Ekranı'} <span className="text-rose-400">*</span>
            </label>
            <select
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                if (error) setError(null);
              }}
              className="input-standard cursor-pointer"
            >
              <option value="">
                {targetType === 'group' ? '-- Hedef Kat / Grup Seçin --' : '-- Hedef TV Ekranı Seçin --'}
              </option>
              {targetType === 'group'
                ? groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.screens?.length || 0} TV Ekranı)
                    </option>
                  ))
                : screens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.group ? `(${s.group.name})` : ''} - {s.status === 'ONLINE' ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </option>
                  ))}
            </select>
          </div>

          {/* Rule Type: Progressive Disclosure (UX-1.5) */}
          <div className="pt-1">
            <label className="block text-xs font-medium text-slate-300 mb-2">Zamanlama Kuralı</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={isDefault}
                  onChange={() => setIsDefault(true)}
                  className="mt-0.5 text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    7/24 Varsayılan (Sürekli) Yayın
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Özel bir zamanlanmış yayın devreye girmediği müddetçe ekranlarda kesintisiz döner.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={!isDefault}
                  onChange={() => setIsDefault(false)}
                  className="mt-0.5 text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Özel Zamanlanmış Yayın (Gün & Saat Kuralı)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Sadece belirlenen saat ve gün aralığında varsayılan yayının yerine geçer.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Progressive Disclosure: Scheduled Time & Days Controls */}
          {!isDefault && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3.5 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Yayın Günleri ({selectedDays.length} Gün Seçili)
                </label>
                <div className="flex gap-1.5">
                  {daysList.map((d) => {
                    const isSelected = selectedDays.includes(d.num);
                    return (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => toggleDay(d.num)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                          isSelected
                            ? 'bg-sky-600 border-sky-500 text-white shadow-sm'
                            : 'border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-900'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Bitiş Saati</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>
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
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Yayın Planını Ekrana Ata
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
