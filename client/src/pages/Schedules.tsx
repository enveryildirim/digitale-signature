import React from 'react';
import { CalendarClock, Plus, Trash2, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Assignment } from '../types';

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
    if (!daysStr) return 'Tüm Günler';
    return daysStr
      .split(',')
      .map((d) => dayLabels[d.trim()] || d)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Yayın Zamanlama ve Atamalar</h2>
          <p className="text-xs text-slate-400 mt-1">
            Hangi ekranda veya katta ne zaman hangi playlist'in oynatılacağını belirleyin
          </p>
        </div>
        <button
          onClick={onOpenScheduleModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow-md shadow-sky-600/30"
        >
          <Plus className="w-4 h-4" />
          Yeni Yayın Planı Ekle
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <CalendarClock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">Henüz Yayın Ataması Yok</h4>
          <p className="text-xs text-slate-500 mt-1">
            TV ekranlarına veya kat gruplarına oynatma listesi atayarak yayını başlatın.
          </p>
          <button
            onClick={onOpenScheduleModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition"
          >
            <Plus className="w-4 h-4" />
            İlk Yayını Planla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment) => {
            const targetName = assignment.screen
              ? `📺 ${assignment.screen.name}`
              : assignment.group
              ? `🏢 ${assignment.group.name} (Tüm TV'ler)`
              : 'Genel';

            return (
              <div
                key={assignment.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-sky-400 block mb-1">
                        {targetName}
                      </span>
                      <h4 className="font-semibold text-white text-base">
                        {assignment.playlist?.name || 'Playlist'}
                      </h4>
                    </div>
                    <button
                      onClick={() => onDeleteAssignment(assignment.id)}
                      title="Atamayı Sil"
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Yayın Türü:</span>
                      {assignment.isDefault ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Varsayılan (Arka Plan)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Zamanlanmış Yayın
                        </span>
                      )}
                    </div>

                    {!assignment.isDefault && (
                      <>
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            Günler:
                          </span>
                          <span className="font-medium text-slate-200">
                            {formatDays(assignment.daysOfWeek)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
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
