import { useLanguage } from '../context/LanguageContext';

export const DEFAULT_FILTERS = {
  radius: 10,
  maxPrice: 5000,
  minRating: 0,
  available: false,
  sort: 'nearest',
};

export const SORTS = {
  nearest: (a, b) => a.distance - b.distance,
  topRated: (a, b) => (b.averageRating || 0) - (a.averageRating || 0) || a.distance - b.distance,
  priceLow: (a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity),
  priceHigh: (a, b) => (b.minPrice ?? -1) - (a.minPrice ?? -1),
};

const PRICE_MAX = 15000;

export default function FilterSidebar({ filters, onChange, onReset }) {
  const { t } = useLanguage();
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <aside className="card space-y-6 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">{t('filter.title')}</h2>
        <button type="button" onClick={onReset} className="text-sm text-blue-600 hover:underline">
          {t('filter.reset')}
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">{t('filter.sortBy')}</span>
        <select className="input mt-1 py-2 text-sm" value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
          {Object.keys(SORTS).map((key) => (
            <option key={key} value={key}>
              {t(`filter.${key}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="flex justify-between text-sm font-medium text-slate-700">
          {t('filter.distance')}{' '}
          <span className="text-slate-500">
            {filters.radius} {t('common.km')}
          </span>
        </span>
        <input
          type="range"
          min="1"
          max="50"
          value={filters.radius}
          onChange={(e) => set('radius', Number(e.target.value))}
          className="mt-2 w-full accent-blue-600"
        />
      </label>

      <label className="block">
        <span className="flex justify-between text-sm font-medium text-slate-700">
          {t('filter.maxPrice')} <span className="text-slate-500">₹{filters.maxPrice.toLocaleString('en-IN')}</span>
        </span>
        <input
          type="range"
          min="100"
          max={PRICE_MAX}
          step="100"
          value={filters.maxPrice}
          onChange={(e) => set('maxPrice', Number(e.target.value))}
          className="mt-2 w-full accent-blue-600"
        />
        <span className="mt-1 block text-xs text-slate-400">{t('filter.maxPriceHint')}</span>
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">{t('filter.rating')}</legend>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {[0, 2, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => set('minRating', r)}
              className={`truncate rounded-lg border px-1 py-1.5 text-xs font-medium ${
                filters.minRating === r
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-blue-400'
              }`}
            >
              {r === 0 ? t('filter.any') : `${r}★`}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{t('filter.availableNow')}</span>
        <input
          type="checkbox"
          checked={filters.available}
          onChange={(e) => set('available', e.target.checked)}
          className="peer sr-only"
        />
        <span className="relative h-6 w-11 flex-none rounded-full bg-slate-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-blue-600 peer-checked:after:translate-x-5" />
      </label>
    </aside>
  );
}
