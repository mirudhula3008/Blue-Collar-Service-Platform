export default function LocationBanner({ status, error, coords, onRetry }) {
  if (status === 'loading') {
    return <p className="text-sm text-slate-500">📍 Detecting your location…</p>;
  }
  if (status === 'success') {
    return (
      <p className="text-sm text-slate-500">
        📍 {coords.label} ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <span>⚠️ {error}</span>
      {status !== 'unsupported' && (
        <button type="button" onClick={onRetry} className="font-medium underline">
          Try again
        </button>
      )}
    </div>
  );
}
