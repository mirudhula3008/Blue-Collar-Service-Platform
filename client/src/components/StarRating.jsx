import { useState } from 'react';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const SIZES = { sm: 'text-base', md: 'text-2xl', lg: 'text-4xl' };

/**
 * Star rating. Interactive when `onChange` is given, read-only otherwise.
 * Interactive mode is a radio group: arrow keys move, number keys 1–5 pick.
 */
export default function StarRating({ value = 0, onChange, size = 'md', showLabel = false }) {
  const [hover, setHover] = useState(0);
  const interactive = Boolean(onChange);
  const shown = hover || value;

  if (!interactive) {
    const rounded = Math.round(value);
    return (
      <span className={`inline-flex ${SIZES[size]} leading-none`} role="img" aria-label={`${value || 0} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rounded ? 'text-amber-400' : 'text-slate-300'} aria-hidden="true">
            ★
          </span>
        ))}
      </span>
    );
  }

  const handleKeyDown = (e) => {
    if (['ArrowRight', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (['ArrowLeft', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      onChange(Math.max(1, (value || 1) - 1));
    } else if (/^[1-5]$/.test(e.key)) {
      onChange(Number(e.key));
    }
  };

  return (
    <div className="inline-flex items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Rating"
        className={`inline-flex ${SIZES[size]} leading-none`}
        onMouseLeave={() => setHover(0)}
        onKeyDown={handleKeyDown}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''} – ${LABELS[n]}`}
            tabIndex={value === n || (!value && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className={`px-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-400 ${
              n <= shown ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {showLabel && <span className="min-w-[5.5rem] text-sm font-medium text-slate-600">{LABELS[shown] || 'Tap to rate'}</span>}
    </div>
  );
}
