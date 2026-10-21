import React, { useState } from 'react';
import { X, CalendarClock, AlertCircle } from 'lucide-react';
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
      setError('Lütfen bir oynatma listesi seçin.');
      return;
    }
    if (!targetId) {
      setError('Lütfen hedef kat/grup veya ekran seçin.');
      return;
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
      setError(err.message || 'Atama kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-white text-base">Yayın Planı & Atama Oluştur</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
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

          {/* Playlist Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Yayınlanacak Oynatma Listesi <span className="text-red-400">*</span>
            </label>
            <select
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Playlist Seçin --</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} ({pl.items?.length || 0} Medya)
                </option>
              ))}
            </select>
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Hedef Türü</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setTargetType('group'); setTargetId(''); }}
                className={`py-2 text-xs font-medium rounded-lg border transition ${
                  targetType === 'group'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                    : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Kat / Grup Bazında
              </button>
              <button
                type="button"
                onClick={() => { setTargetType('screen'); setTargetId(''); }}
                className={`py-2 text-xs font-medium rounded-lg border transition ${
                  targetType === 'screen'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                    : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Belirli Bir TV Ekranı
              </button>
            </div>
          </div>

          {/* Target ID Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {targetType === 'group' ? 'Hedef Kat / Grup' : 'Hedef TV Ekranı'} <span className="text-red-400">*</span>
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">
                {targetType === 'group' ? '-- Kat / Grup Seçin --' : '-- TV Ekranı Seçin --'}
              </option>
              {targetType === 'group'
                ? groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.screens?.length || 0} TV)
                    </option>
                  ))
                : screens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.group ? `(${s.group.name})` : ''} - {s.status}
                    </option>
                  ))}
            </select>
          </div>

          {/* Rule Type: Default vs Scheduled */}
          <div className="pt-1">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Zamanlama Türü</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={isDefault}
                  onChange={() => setIsDefault(true)}
                  className="text-sky-500 focus:ring-0"
                />
                <span>Varsayılan (Arka Plan) Yayın - Sürekli döner</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={!isDefault}
                  onChange={() => setIsDefault(false)}
                  className="text-sky-500 focus:ring-0"
                />
                <span>Zamanlanmış Özel Yayın (Belirli saat/günlerde devreye girer)</span>
              </label>
            </div>
          </div>

          {/* Scheduled Time & Days Controls */}
          {!isDefault && (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Yayın Günleri</label>
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
                            ? 'bg-sky-600 border-sky-500 text-white'
                            : 'border-slate-800 text-slate-500 hover:text-slate-300'
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
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Bitiş Saati</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

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
              className="px-4 py-2 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Yayın Planını Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
