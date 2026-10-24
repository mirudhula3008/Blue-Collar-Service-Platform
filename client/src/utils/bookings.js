export const STATUS = {
  requested: { label: 'Requested', badge: 'bg-sky-50 text-sky-700 ring-sky-200' },
  accepted: { label: 'Accepted', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  in_progress: { label: 'In progress', badge: 'bg-amber-50 text-amber-800 ring-amber-200' },
  completed: { label: 'Completed', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  rejected: { label: 'Declined', badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
  cancelled: { label: 'Cancelled', badge: 'bg-slate-100 text-slate-600 ring-slate-200' },
  cancelled_by_admin: { label: 'Cancelled by admin', badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

export const ACTIVE = ['requested', 'accepted', 'in_progress'];

// scheduledDate is stored as UTC midnight of the chosen day, so format it in UTC.
export const formatScheduleDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export const formatTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
};

// YYYY-MM-DD for a local Date.
export const toDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Sort key so upcoming jobs appear soonest-first.
export const scheduleKey = (b) => `${String(b.scheduledDate).slice(0, 10)} ${b.scheduledTime}`;

export const CLOSED = ['rejected', 'cancelled', 'cancelled_by_admin'];

export const PAYMENT_METHOD_LABEL = { upi: 'UPI', card: 'Card', wallet: 'Wallet', cash: 'Cash' };
