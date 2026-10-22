interface FilterChipsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
}

/** Single-select pill filter with optional result counts */
export function FilterChips<T extends string>({ value, onChange, options }: FilterChipsProps<T>) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none" role="radiogroup">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && <span className="ml-1 opacity-70">({opt.count})</span>}
          </button>
        );
      })}
    </div>
  );
}
