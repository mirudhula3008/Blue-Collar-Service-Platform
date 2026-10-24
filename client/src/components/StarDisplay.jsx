// Read-only star rating. (The interactive star input belongs to Module 4.)
export default function StarDisplay({ rating = 0, count, size = 'text-sm' }) {
  const rounded = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-1 ${size}`} aria-label={`Rated ${rating} out of 5`}>
      <span className="text-amber-400 tracking-tight">
        {'★'.repeat(rounded)}
        <span className="text-slate-300">{'★'.repeat(5 - rounded)}</span>
      </span>
      <span className="text-slate-600 font-medium">{rating ? rating.toFixed(1) : 'New'}</span>
      {count != null && <span className="text-slate-400">({count})</span>}
    </span>
  );
}
