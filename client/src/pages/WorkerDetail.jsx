import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StarDisplay from '../components/StarDisplay';
import WorkerMap from '../components/WorkerMap';
import { getWorker, getWorkerReviews } from '../api/discovery';
import { formatDate, formatPrice, formatPriceRange } from '../utils/format';

const REVIEWS_PER_PAGE = 5;

export default function WorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    setWorker(null);
    setError(null);
    setReviews([]);
    setReviewPage(1);
    getWorker(id)
      .then(setWorker)
      .catch((err) => setError(err.response?.data?.message || 'Could not load this worker.'));
  }, [id]);

  useEffect(() => {
    setReviewsLoading(true);
    getWorkerReviews(id, reviewPage, REVIEWS_PER_PAGE)
      .then((data) => {
        setReviews((prev) => (reviewPage === 1 ? data.reviews : [...prev, ...data.reviews]));
        setReviewPages(data.pages);
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [id, reviewPage]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-red-700">{error}</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  if (!worker) {
    return <div className="mx-auto mt-8 h-64 max-w-5xl animate-pulse rounded-xl bg-slate-200 px-4" />;
  }

  const [lng, lat] = worker.location?.coordinates || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <button type="button" onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">
        ← Back to results
      </button>

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Profile header */}
          <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row">
            <img
              src={worker.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name)}`}
              alt={worker.name}
              className="h-24 w-24 flex-none rounded-full object-cover bg-slate-100"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{worker.name}</h1>
                {worker.isVerified && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">✔ Verified</span>
                )}
              </div>
              <p className="capitalize text-slate-600">
                {worker.serviceCategory}
                {worker.experienceYears ? ` · ${worker.experienceYears} yrs experience` : ''}
              </p>
              <div className="mt-1">
                <StarDisplay rating={worker.averageRating} count={worker.totalReviews} size="text-base" />
              </div>
              {worker.address && <p className="mt-1 text-sm text-slate-500">📍 {worker.address}</p>}
              {worker.bio && <p className="mt-3 text-slate-700">{worker.bio}</p>}
            </div>
          </section>

          {/* Services */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Services &amp; prices</h2>
            {worker.services?.length ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {worker.services.map((s) => (
                  <li key={s._id || s.name} className="flex items-center justify-between py-3">
                    <span className="text-slate-700">{s.name}</span>
                    <span className="font-semibold text-slate-900">
                      {formatPrice(s.price)} <span className="text-xs font-normal text-slate-400">{s.unit}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-slate-500">This worker hasn't listed any services yet.</p>
            )}
            {worker.isNegotiable && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                💬 Prices are negotiable — you can agree on a price when booking.
              </p>
            )}
          </section>

          {/* Reviews */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Reviews ({worker.totalReviews || 0})</h2>
            {reviews.length === 0 && !reviewsLoading && <p className="mt-3 text-slate-500">No reviews yet.</p>}
            <ul className="mt-3 space-y-4">
              {reviews.map((r) => (
                <li key={r._id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">{r.customerId?.name || 'Customer'}</span>
                    <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <StarDisplay rating={r.rating} />
                  {r.comment && <p className="mt-1 text-slate-700">{r.comment}</p>}
                </li>
              ))}
            </ul>
            {reviewPage < reviewPages && (
              <button
                type="button"
                disabled={reviewsLoading}
                onClick={() => setReviewPage((p) => p + 1)}
                className="mt-4 text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
              >
                {reviewsLoading ? 'Loading…' : 'Show more reviews'}
              </button>
            )}
          </section>
        </div>

        {/* Booking sidebar */}
        <aside className="space-y-4 md:sticky md:top-20 md:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Price range</p>
            <p className="text-2xl font-bold text-slate-900">{formatPriceRange(worker.minPrice, worker.maxPrice)}</p>
            <p className={`mt-1 text-sm font-medium ${worker.availability ? 'text-emerald-600' : 'text-slate-500'}`}>
              {worker.availability ? '● Available' : '● Currently busy'}
            </p>
            {/* Booking form route is owned by Module 3 */}
            <Link
              to={`/book/${worker._id}`}
              state={{ worker }}
              className={`mt-4 block rounded-lg px-4 py-2.5 text-center font-semibold text-white ${
                worker.availability ? 'bg-blue-600 hover:bg-blue-700' : 'pointer-events-none bg-slate-300'
              }`}
              aria-disabled={!worker.availability}
            >
              Book Now
            </Link>
          </div>

          {lat != null && (
            <WorkerMap workers={[worker]} center={[lat, lng]} showUser={false} className="h-56" />
          )}
        </aside>
      </div>
    </div>
  );
}
