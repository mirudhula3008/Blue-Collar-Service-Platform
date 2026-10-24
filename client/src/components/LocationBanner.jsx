import { LocateFixed, MapPin } from 'lucide-react';

// Shows where results are centred and the live-location switch.
export default function LocationBanner({ status, error, coords, live, setLive }) {
  const locating = status === 'locating';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          {live ? (
            <LocateFixed size={16} className={locating ? 'animate-pulse text-blue-600' : 'text-blue-600'} aria-hidden="true" />
          ) : (
            <MapPin size={16} className="text-rose-500" aria-hidden="true" />
          )}
          {locating ? (
            'Finding your live location…'
          ) : live ? (
            <>
              <span className="font-semibold text-navy">Live location</span>
              <span className="tabular-nums text-slate-400">
                ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </span>
            </>
          ) : (
            <>
              Showing workers near <span className="font-semibold text-navy">{coords.label}</span>
            </>
          )}
        </p>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
          <input type="checkbox" className="peer sr-only" checked={live} onChange={(e) => setLive(e.target.checked)} />
          <span
            className="relative h-5 w-9 flex-none rounded-full bg-slate-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-blue-600 peer-checked:after:translate-x-4 peer-focus-visible:shadow-glow"
            aria-hidden="true"
          />
          Use live location
        </label>
      </div>

      {error && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}
      {live && !locating && !error && (
        <p className="text-xs text-slate-400">Updates automatically as you move. On a laptop the browser may only estimate your position.</p>
      )}
    </div>
  );
}
