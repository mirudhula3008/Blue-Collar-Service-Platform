import { STATUS } from '../utils/bookings';

export default function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, badge: 'bg-slate-100 text-slate-600 ring-slate-200' };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.badge}`}>{s.label}</span>;
}
