import { Link } from 'react-router-dom';
import StarDisplay from './StarDisplay';
import { formatDistance, formatPriceRange } from '../utils/format';

export default function WorkerCard({ worker, highlighted, onHover }) {
  return (
    <Link
      to={`/workers/${worker._id}`}
      onMouseEnter={() => onHover?.(worker._id)}
      onMouseLeave={() => onHover?.(null)}
      className={`flex gap-4 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        highlighted ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <img
        src={worker.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name)}`}
        alt={worker.name}
        className="h-16 w-16 flex-none rounded-full object-cover bg-slate-100"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-slate-900">{worker.name}</h3>
          <span className="flex-none text-xs text-slate-500">{formatDistance(worker.distance)}</span>
        </div>
        <StarDisplay rating={worker.averageRating} count={worker.totalReviews} />
        <p className="mt-1 text-sm font-medium text-slate-800">{formatPriceRange(worker.minPrice, worker.maxPrice)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {worker.isNegotiable && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">Negotiable</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              worker.availability ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {worker.availability ? 'Available' : 'Busy'}
          </span>
          {worker.address && <span className="truncate text-slate-400">{worker.address}</span>}
        </div>
      </div>
    </Link>
  );
}
