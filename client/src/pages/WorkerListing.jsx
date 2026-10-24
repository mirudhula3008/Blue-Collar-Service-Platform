import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FilterSidebar, { DEFAULT_FILTERS } from '../components/FilterSidebar';
import LocationBanner from '../components/LocationBanner';
import WorkerCard from '../components/WorkerCard';
import WorkerMap from '../components/WorkerMap';
import useGeolocation from '../hooks/useGeolocation';
import { getCategories, searchWorkers } from '../api/discovery';

export default function WorkerListing() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const location = useGeolocation();
  const { coords, status } = location;

  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [view, setView] = useState('list'); // mobile only: 'list' | 'map'

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    // Wait for the first live fix instead of searching Chennai and then jumping.
    if (status === 'locating') return undefined;

    // Debounce so dragging a slider doesn't fire a request per pixel.
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchWorkers({
        lat: coords.lat,
        lng: coords.lng,
        category: category || undefined,
        radius: filters.radius,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating || undefined,
        available: filters.available || undefined,
      })
        .then((data) => setWorkers(data.workers))
        .catch((err) => setError(err.response?.data?.message || 'Could not load workers.'))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [coords.lat, coords.lng, status, category, filters]);

  const categoryName = useMemo(
    () => categories.find((c) => c.id === category)?.name || 'All services',
    [categories, category]
  );
  const center = [coords.lat, coords.lng];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← All services
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-navy">{categoryName} near you</h1>
          <LocationBanner {...location} />
        </div>
        <p className="text-sm text-slate-500">
          {loading ? 'Searching…' : `${workers.length} worker${workers.length === 1 ? '' : 's'} within ${filters.radius} km`}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <FilterSidebar filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
        </div>

        <section className="min-w-0 space-y-4">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-sm lg:hidden">
            {['list', 'map'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`flex-1 rounded-md py-1.5 font-medium capitalize ${
                  view === v ? 'bg-blue-600 text-white' : 'text-slate-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className={view === 'map' ? 'block' : 'hidden lg:block'}>
            <WorkerMap
              workers={workers}
              center={center}
              radiusKm={filters.radius}
              highlightedId={hoveredId}
              className="h-[60vh] lg:h-80"
            />
          </div>

          <div className={view === 'list' ? 'block' : 'hidden lg:block'}>
            {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

            {!error && loading && (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
                ))}
              </div>
            )}

            {!error && !loading && workers.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                No workers match these filters. Try a larger distance or a higher price limit.
              </div>
            )}

            {!error && !loading && workers.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {workers.map((w) => (
                  <WorkerCard key={w._id} worker={w} highlighted={w._id === hoveredId} onHover={setHoveredId} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
