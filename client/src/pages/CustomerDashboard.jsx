import { useEffect, useState } from 'react';
import CategoryCard from '../components/CategoryCard';
import LocationBanner from '../components/LocationBanner';
import useGeolocation from '../hooks/useGeolocation';
import { getCategories } from '../api/discovery';
import { useLanguage } from '../context/LanguageContext';

export default function CustomerDashboard() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useGeolocation();

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setError('categoriesError'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-4xl text-navy sm:text-5xl">{t('discovery.dashboardTitle')}</h1>
      <p className="mt-1 text-slate-600">{t('discovery.dashboardSubtitle')}</p>
      <div className="mt-3">
        <LocationBanner {...location} />
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{t(`discovery.${error}`)}</p>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200" />
            ))
          : categories.map((c) => <CategoryCard key={c.id} category={c} />)}
      </div>
    </div>
  );
}
