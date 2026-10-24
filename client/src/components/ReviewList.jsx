import { useEffect, useState } from 'react';
import StarRating from './StarRating';
import { getReviewsForWorker } from '../api/reviews';
import { formatDate } from '../utils/format';

const PER_PAGE = 5;

// Rating summary + paginated reviews for one worker. Used on the worker detail
// page (Module 2) and the worker's own Reviews tab.
export default function ReviewList({ workerId }) {
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setReviews([]);
    setPage(1);
  }, [workerId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReviewsForWorker(workerId, page, PER_PAGE)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setReviews((prev) => (page === 1 ? res.reviews : [...prev, ...res.reviews]));
      })
      .catch(() => !cancelled && setError('Could not load reviews.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [workerId, page]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <div className="h-32 animate-pulse rounded-xl bg-slate-100" />;

  return (
    <div className="space-y-6">
      <RatingSummary averageRating={data.averageRating} total={data.total} breakdown={data.breakdown} />

      {data.total === 0 ? (
        <p className="text-slate-500">No reviews yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {reviews.map((r) => (
            <li key={r._id} className="py-4 first:pt-0">
              <div className="flex items-center gap-3">
                <img
                  src={
                    r.customerId?.profilePhoto ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(r.customerId?.name || 'C')}&size=64`
                  }
                  alt=""
                  className="h-9 w-9 rounded-full bg-slate-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{r.customerId?.name || 'Customer'}</p>
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} size="sm" />
                    <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              </div>
              {r.comment && <p className="mt-2 whitespace-pre-line text-slate-700">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {page < data.pages && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
          className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Show more reviews'}
        </button>
      )}
    </div>
  );
}

function RatingSummary({ averageRating, total, breakdown }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="text-center sm:w-36">
        <p className="text-4xl font-bold text-slate-900">{total ? averageRating.toFixed(1) : '–'}</p>
        <StarRating value={averageRating} size="sm" />
        <p className="text-xs text-slate-500">
          {total} review{total === 1 ? '' : 's'}
        </p>
      </div>
      <div className="flex-1 space-y-1">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = breakdown[stars] || 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={stars} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-6 text-right">{stars}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
