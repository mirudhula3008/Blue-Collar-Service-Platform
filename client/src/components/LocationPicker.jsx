import { useState } from 'react';
import { getCurrentPosition } from '../utils/location';

// value: { lat, lng } | null
export default function LocationPicker({ value, onChange, required }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const locate = async () => {
    setStatus('loading');
    setError(null);
    try {
      onChange(await getCurrentPosition());
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div>
      <span className="text-sm font-medium text-slate-700">
        Location {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={locate}
          disabled={status === 'loading'}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-400 disabled:opacity-60"
        >
          {status === 'loading' ? 'Locating…' : value ? '📍 Update location' : '📍 Use my current location'}
        </button>
        {value && (
          <span className="text-sm text-emerald-700">
            ✓ {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
