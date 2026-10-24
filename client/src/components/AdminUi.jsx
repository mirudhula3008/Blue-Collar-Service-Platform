import { useEffect, useState } from 'react';
import { Ban, CircleCheck, PauseCircle, Search, ShieldAlert } from 'lucide-react';

// Account statuses an admin can set, with copy used across the admin pages.
export const ACCOUNT_STATUS = {
  active: {
    label: 'Active',
    Icon: CircleCheck,
    badge: 'bg-emerald-50 text-emerald-700',
    help: 'Visible in search and can receive bookings.',
  },
  under_review: {
    label: 'Under review',
    Icon: ShieldAlert,
    badge: 'bg-amber-100 text-amber-800',
    help: 'Hidden from search while you investigate. Existing bookings continue.',
  },
  suspended: {
    label: 'Suspended',
    Icon: PauseCircle,
    badge: 'bg-orange-100 text-orange-800',
    help: 'Temporarily removed. Pending and accepted bookings are cancelled and refunded.',
  },
  blocked: {
    label: 'Blocked',
    Icon: Ban,
    badge: 'bg-rose-100 text-rose-700',
    help: 'Permanently removed. Pending and accepted bookings are cancelled and refunded.',
  },
};

// Status always shows icon + label, never colour alone.
export function AccountStatusBadge({ status = 'active' }) {
  const s = ACCOUNT_STATUS[status] || ACCOUNT_STATUS.active;
  const { Icon } = s;
  return (
    <span className={`badge ${s.badge}`}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" /> {s.label}
    </span>
  );
}

export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="relative block sm:flex-1">
      <span className="sr-only">{placeholder}</span>
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="search" className="input pl-10" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function FilterChips({ options, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
            value === o.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400'
          }`}
        >
          {o.label}
          {o.count != null && <span className="ml-1.5 opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pager({ page, pages, total, noun = 'result', onPage }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
      <span>
        {total} {noun}
        {total === 1 ? '' : 's'} · page {page} of {Math.max(pages, 1)}
      </span>
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ← Prev
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}

export const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const dateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
