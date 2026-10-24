import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Compact globe + language dropdown for the navbar.
export default function LanguageSelector({ onChange }) {
  const { currentLanguage, changeLanguage, languages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = languages.find((l) => l.code === currentLanguage) || languages[0];

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = (code) => {
    setOpen(false);
    if (code === currentLanguage) return;
    changeLanguage(code);
    onChange?.(code);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-navy"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('nav.language')}: ${current.nativeName}`}
      >
        <Globe size={16} aria-hidden="true" />
        <span>{current.nativeName}</span>
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('nav.language')}
          className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lift"
        >
          {languages.map((l) => {
            const selected = l.code === currentLanguage;
            return (
              <li key={l.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  lang={l.code}
                  onClick={() => select(l.code)}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition hover:bg-slate-50 ${
                    selected ? 'font-semibold text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <span>
                    {l.nativeName}
                    {l.code !== 'en' && <span className="ml-1 text-xs font-normal text-slate-400">({l.name})</span>}
                  </span>
                  {selected && <Check size={16} className="text-blue-600" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
