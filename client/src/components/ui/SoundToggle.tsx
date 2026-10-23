import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

// Video medyasının TV'de sesli mi sessiz mi oynatılacağını belirleyen anahtar
export const SoundToggle: React.FC<SoundToggleProps> = ({ enabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    onClick={() => onChange(!enabled)}
    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition text-left"
  >
    <span className="flex items-center gap-2.5">
      {enabled ? (
        <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
      ) : (
        <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
      )}
      <span>
        <span className="block text-xs font-medium text-slate-200">
          {enabled ? 'Sesli oynat' : 'Sessiz oynat'}
        </span>
        <span className="block text-[11px] text-slate-500">
          TV'lerde videonun sesi {enabled ? 'açık' : 'kapalı'} olur. Admin önizlemesi her zaman sessizdir.
        </span>
      </span>
    </span>
    <span
      className={`relative w-9 h-5 rounded-full shrink-0 transition ${enabled ? 'bg-sky-500' : 'bg-slate-700'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : ''}`}
      />
    </span>
  </button>
);
