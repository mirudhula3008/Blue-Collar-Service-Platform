import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FilterSidebar, { DEFAULT_FILTERS, SORTS } from '../components/FilterSidebar';
import LocationBanner from '../components/LocationBanner';
import WorkerCard from '../components/WorkerCard';
import WorkerMap from '../components/WorkerMap';
import useGeolocation from '../hooks/useGeolocation';
import { useLanguage } from '../context/LanguageContext';
import { searchWorkers } from '../api/discovery';
import { errorMessage } from '../api/client';
import { categoryIds } from '../data/categories';

export default function WorkerListing() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const location = useGeolocation();
  const { coords, status } = location;

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [view, setView] = useState('list'); // mobile only: 'list' | 'map'

  const { radius, maxPrice, minRating, available } = filters;

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
        radius,
        maxPrice,
        minRating: minRating || undefined,
        available: available || undefined,
      })
        .then((data) => setWorkers(data.workers))
        .catch((err) => setError(errorMessage(err, t('discovery.loadError'))))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
    // Sorting is client-side, so it isn't a dependency; t only changes the fallback message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords.lat, coords.lng, status, category, radius, maxPrice, minRating, available]);

  const sorted = useMemo(() => [...workers].sort(SORTS[filters.sort] || SORTS.nearest), [workers, filters.sort]);

  const title = categoryIds.includes(category)
    ? t('discovery.nearYou', { category: t(`services.${category}`) })
    : t('discovery.allNearYou');
  const center = [coords.lat, coords.lng];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
        {t('discovery.allServices')}
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl text-navy sm:text-4xl">{title}</h1>
          <LocationBanner {...location} />
        </div>
        <p className="text-sm text-slate-500">
          {loading ? t('discovery.searching') : t('discovery.count', { count: workers.length, km: radius })}
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
                className={`flex-1 rounded-md py-1.5 font-medium ${view === v ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              >
                {t(`discovery.${v}`)}
              </button>
            ))}
          </div>

          <div className={view === 'map' ? 'block' : 'hidden lg:block'}>
            <WorkerMap workers={workers} center={center} radiusKm={radius} highlightedId={hoveredId} className="h-[60vh] lg:h-80" />
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
                {t('discovery.noMatch')}
              </div>
            )}

            {!error && !loading && workers.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {sorted.map((w) => (
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
