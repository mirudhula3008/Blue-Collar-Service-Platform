export const DEFAULT_FILTERS = {
  radius: 10,
  maxPrice: 5000,
  minRating: 0,
  available: false,
};

const PRICE_MAX = 15000;

export default function FilterSidebar({ filters, onChange, onReset }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <aside className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Filters</h2>
        <button type="button" onClick={onReset} className="text-sm text-blue-600 hover:underline">
          Reset
        </button>
      </div>

      <label className="block">
        <span className="flex justify-between text-sm font-medium text-slate-700">
          Distance <span className="text-slate-500">{filters.radius} km</span>
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
          Max price <span className="text-slate-500">₹{filters.maxPrice.toLocaleString('en-IN')}</span>
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
        <span className="mt-1 block text-xs text-slate-400">Shows workers with at least one service at or below this price</span>
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Minimum rating</legend>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {[0, 2, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => set('minRating', r)}
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                filters.minRating === r
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-blue-400'
              }`}
            >
              {r === 0 ? 'Any' : `${r}★`}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Available now only</span>
        <input
          type="checkbox"
          checked={filters.available}
          onChange={(e) => set('available', e.target.checked)}
          className="peer sr-only"
        />
        <span className="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
      </label>
    </aside>
  );
}
