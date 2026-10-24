// Read-only star rating with numeric value: ★★★★☆ 4.0 (23 reviews).
export default function StarDisplay({ rating = 0, count, size = 'text-sm' }) {
  const rounded = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-1.5 ${size}`} aria-label={`Rated ${rating || 0} out of 5`}>
      <span className="tracking-tight text-amber-400" aria-hidden="true">
        {'★'.repeat(rounded)}
        <span className="text-slate-200">{'★'.repeat(5 - rounded)}</span>
      </span>
      {rating ? (
        <span className="font-medium text-slate-600">{rating.toFixed(1)}</span>
      ) : (
        <span className="badge badge-new">New</span>
      )}
      {count != null && rating > 0 && (
        <span className="text-slate-400">
          ({count} review{count === 1 ? '' : 's'})
        </span>
      )}
    </span>
  );
}
