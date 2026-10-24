import { useLanguage } from '../context/LanguageContext';

// Read-only star rating with numeric value: ★★★★☆ 4.0 (23 reviews).
export default function StarDisplay({ rating = 0, count, size = 'text-sm' }) {
  const { t } = useLanguage();
  const rounded = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-1.5 ${size}`} aria-label={`${t('worker.rating')}: ${rating || 0} / 5`}>
      <span className="tracking-tight text-amber-400" aria-hidden="true">
        {'★'.repeat(rounded)}
        <span className="text-slate-200">{'★'.repeat(5 - rounded)}</span>
      </span>
      {rating ? (
        <span className="font-medium text-slate-600">{rating.toFixed(1)}</span>
      ) : (
        <span className="badge badge-new">{t('worker.new')}</span>
      )}
      {count != null && rating > 0 && <span className="text-slate-400">{t('worker.reviewCount', { count })}</span>}
    </span>
  );
}
