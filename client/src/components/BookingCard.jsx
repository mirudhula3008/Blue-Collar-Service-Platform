import StatusBadge from './StatusBadge';
import BookingLocationMap from './BookingLocationMap';
import { formatPrice } from '../utils/format';
import { formatScheduleDate, formatTime } from '../utils/bookings';

/**
 * One booking. `viewer` is 'customer' (shows the worker) or 'worker' (shows the customer).
 * Action buttons go in `children`.
 */
export default function BookingCard({ booking, viewer, showMap = false, children }) {
  const other = viewer === 'customer' ? booking.workerId : booking.customerId;
  const name = other?.name || (viewer === 'customer' ? 'Worker' : 'Customer');

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <img
          src={other?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=96`}
          alt=""
          className="h-12 w-12 flex-none rounded-full bg-slate-100 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="truncate font-semibold text-slate-900">{name}</h3>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-slate-600">
            {booking.serviceName} <span className="capitalize text-slate-400">· {booking.serviceCategory}</span>
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-400">When</dt>
          <dd className="font-medium text-slate-800">
            {formatScheduleDate(booking.scheduledDate)}, {formatTime(booking.scheduledTime)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Agreed price</dt>
          <dd className="font-medium text-slate-800">{formatPrice(booking.agreedPrice)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Phone</dt>
          <dd className="font-medium text-slate-800">
            {other?.phone ? (
              <a href={`tel:${other.phone}`} className="text-blue-600 hover:underline">
                {other.phone}
              </a>
            ) : (
              <span className="text-slate-400">Shared once accepted</span>
            )}
          </dd>
        </div>
      </dl>

      {booking.description && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{booking.description}</p>
      )}

      {showMap && booking.customerLocation && (
        <div className="mt-3">
          <BookingLocationMap location={booking.customerLocation} />
        </div>
      )}

      {children && <div className="mt-4 flex flex-wrap gap-2">{children}</div>}
    </article>
  );
}

export const buttonStyles = {
  primary: 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50',
  success: 'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50',
  danger:
    'rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50',
  ghost:
    'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-400 disabled:opacity-50',
};
