import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, MapPin } from 'lucide-react';
import StarDisplay from '../components/StarDisplay';
import WorkerMap from '../components/WorkerMap';
import ReviewList from '../components/ReviewList';
import { useAuth } from '../context/AuthContext';
import { getWorker } from '../api/discovery';
import { formatPrice, formatPriceRange } from '../utils/format';

export default function WorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [worker, setWorker] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setWorker(null);
    setError(null);
    getWorker(id)
      .then(setWorker)
      .catch((err) => setError(err.response?.data?.message || 'Could not load this worker.'));
  }, [id]);

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
          <section className="card flex flex-col gap-5 p-6 sm:flex-row">
            {worker.profilePhoto ? (
              <img src={worker.profilePhoto} alt="" className="h-24 w-24 flex-none rounded-full bg-slate-100 object-cover" />
            ) : (
              <span className="flex h-24 w-24 flex-none items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-4xl font-semibold text-white">
                {worker.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl text-navy sm:text-4xl">{worker.name}</h1>
                {worker.isVerified && (
                  <span className="badge badge-verified">
                    <Check size={12} strokeWidth={3} /> Verified
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="badge badge-outline capitalize">{worker.serviceCategory}</span>
                {worker.experienceYears > 0 && <span className="badge badge-outline">{worker.experienceYears} yrs experience</span>}
                {worker.isNegotiable && <span className="badge badge-negotiable">Negotiable</span>}
              </div>
              <div className="mt-2">
                <StarDisplay rating={worker.averageRating} count={worker.totalReviews} size="text-base" />
              </div>
              {worker.address && (
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                  <MapPin size={14} className="text-rose-500" /> {worker.address}
                </p>
              )}
              {worker.bio && <p className="mt-3 leading-relaxed text-slate-600">{worker.bio}</p>}
            </div>
          </section>

          {/* Services */}
          <section className="card p-6">
            <h2 className="font-display text-2xl text-navy">Services &amp; prices</h2>
            {worker.services?.length ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {worker.services.map((s) => (
                  <li key={s._id || s.name} className="flex items-center justify-between py-3">
                    <span className="text-slate-700">{s.name}</span>
                    <span className="font-bold text-navy">
                      {formatPrice(s.price)} <span className="text-xs font-normal text-slate-400">{s.unit}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-slate-500">This worker hasn't listed any services yet.</p>
            )}
            {worker.isNegotiable && (
              <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                💬 Prices are negotiable. You can offer your own price when booking.
              </p>
            )}
          </section>

          {/* Reviews */}
          <section className="card p-6">
            <h2 className="mb-4 font-display text-2xl text-navy">Reviews</h2>
            <ReviewList workerId={worker._id} />
          </section>
        </div>

        {/* Booking sidebar */}
        <aside className="space-y-4 md:sticky md:top-24 md:self-start">
          <div className="card p-6">
            <p className="caption">Price range</p>
            <p className="mt-1 text-3xl font-bold text-navy">{formatPriceRange(worker.minPrice, worker.maxPrice)}</p>
            <div className="mt-3">
              {worker.availability ? (
                <span className="badge badge-available">
                  <span className="h-2 w-2 rounded-full bg-blue-600" /> Available
                </span>
              ) : (
                <span className="badge badge-busy">Currently busy</span>
              )}
            </div>
            {user && user.role !== 'customer' ? (
              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Log in as a customer to book.</p>
            ) : (
              <Link
                to={`/book/${worker._id}`}
                state={{ worker }}
                className={`btn mt-5 w-full py-3 ${worker.availability ? 'btn-amber' : 'pointer-events-none bg-slate-200 text-slate-500'}`}
                aria-disabled={!worker.availability}
              >
                {!worker.availability ? 'Not taking bookings' : user ? 'Book Now' : 'Log in to book'}
              </Link>
            )}
          </div>

          {lat != null && (
            <WorkerMap workers={[worker]} center={[lat, lng]} showUser={false} className="h-56" />
          )}
        </aside>
      </div>
    </div>
  );
}
