import { STATUS } from '../utils/bookings';
import { useLanguage } from '../context/LanguageContext';

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const s = STATUS[status] || { badge: 'bg-slate-100 text-slate-600 ring-slate-200' };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.badge}`}>
      {STATUS[status] ? t(`booking.status.${status}`) : status}
    </span>
  );
}
