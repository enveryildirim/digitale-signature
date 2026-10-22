import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/** Search box with clear button and a global "/" shortcut to focus it */
export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${placeholder} (/)`}
        className="input-standard pl-9 pr-9 py-2"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Aramayı temizle"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
