import React from 'react';
import { CalendarClock, Plus, Trash2, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Assignment } from '../types';
import { EmptyState } from '../components/ui/EmptyState';

interface SchedulesProps {
  assignments: Assignment[];
  onOpenScheduleModal: () => void;
  onDeleteAssignment: (id: string) => Promise<void>;
}

export const Schedules: React.FC<SchedulesProps> = ({
  assignments,
  onOpenScheduleModal,
  onDeleteAssignment
}) => {
  const dayLabels: Record<string, string> = {
    '1': 'Pzt',
    '2': 'Sal',
    '3': 'Çar',
    '4': 'Per',
    '5': 'Cum',
    '6': 'Cmt',
    '7': 'Paz'
  };

  const formatDays = (daysStr?: string | null) => {
    if (!daysStr) return 'Tüm Günler (Haftanın 7 Günü)';
    return daysStr
      .split(',')
      .map((d) => dayLabels[d.trim()] || d)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Zamanlama</h2>
          <p className="text-sm text-slate-400 mt-1">
            Hangi ekranda veya katta ne zaman hangi oynatma listesinin yayınlanacağını belirleyin
          </p>
        </div>
        <button
          onClick={onOpenScheduleModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Yeni plan
        </button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Henüz yayın planı yok"
          description="Belirli gün ve saatlerde farklı bir playlist oynatmak için plan oluşturun."
        >
          <button onClick={onOpenScheduleModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            İlk planı oluştur
          </button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map((assignment) => {
            const targetName = assignment.screen
              ? assignment.screen.name
              : assignment.group
              ? `${assignment.group.name} (tüm kat)`
              : 'Genel';

            return (
              <div
                key={assignment.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-sky-400 block mb-1">
                        {targetName}
                      </span>
                      <h4 className="font-semibold text-white text-base tracking-wide">
                        {assignment.playlist?.name || 'Playlist'}
                      </h4>
                    </div>
                    <button
                      onClick={() => onDeleteAssignment(assignment.id)}
                      title="Yayın Planını Kaldır"
                      aria-label="Yayın planını kaldır"
                      className="btn-ghost text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Yayın Türü:</span>
                      {assignment.isDefault ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          7/24 Varsayılan Yayın
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Zamanlanmış Yayın
                        </span>
                      )}
                    </div>

                    {!assignment.isDefault && (
                      <>
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Aktif Günler:
                          </span>
                          <span className="font-medium text-slate-200">
                            {formatDays(assignment.daysOfWeek)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Saat Aralığı:
                          </span>
                          <span className="font-mono font-bold text-sky-400">
                            {assignment.startTime} - {assignment.endTime}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
