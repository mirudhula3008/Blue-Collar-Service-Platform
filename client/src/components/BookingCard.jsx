import StatusBadge from './StatusBadge';
import BookingLocationMap from './BookingLocationMap';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/format';
import { formatScheduleDate, formatTime } from '../utils/bookings';

/**
 * One booking. `viewer` is 'customer' (shows the worker) or 'worker' (shows the customer).
 * Action buttons go in `children`.
 */
export default function BookingCard({ booking, viewer, showMap = false, children }) {
  const { t } = useLanguage();
  const other = viewer === 'customer' ? booking.workerId : booking.customerId;
  const name = other?.name || t(viewer === 'customer' ? 'nav.roles.worker' : 'nav.roles.customer');

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <img
          src={other?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=96`}
          alt=""
          className="h-12 w-12 flex-none rounded-full bg-slate-100 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="truncate font-semibold text-slate-900">{name}</h3>
            <span className="flex flex-wrap items-center gap-1.5">
              <PaymentBadge booking={booking} />
              <StatusBadge status={booking.status} />
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {booking.serviceName} <span className="capitalize text-slate-400">· {booking.serviceCategory}</span>
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-400">{t('booking.when')}</dt>
          <dd className="font-medium text-slate-800">
            {formatScheduleDate(booking.scheduledDate)}, {formatTime(booking.scheduledTime)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">{t('booking.agreedPrice')}</dt>
          <dd className="font-medium text-slate-800">{formatPrice(booking.agreedPrice)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">{t('booking.phone')}</dt>
          <dd className="font-medium text-slate-800">
            {other?.phone ? (
              <a href={`tel:${other.phone}`} className="text-blue-600 hover:underline">
                {other.phone}
              </a>
            ) : (
              <span className="text-slate-400">{t('booking.phoneHidden')}</span>
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
  primary: 'btn btn-primary btn-sm',
  success: 'btn btn-success btn-sm',
  danger: 'btn btn-danger btn-sm',
  ghost: 'btn btn-secondary btn-sm',
};

function PaymentBadge({ booking }) {
  const { t } = useLanguage();
  if (booking.paymentStatus === 'paid') {
    const cash = booking.paymentMethod === 'cash';
    return (
      <span className={`badge ${cash ? 'badge-negotiable' : 'badge-verified'}`}>
        {cash ? t('booking.cashOnDelivery') : t('booking.paidVia', { method: t(`booking.methods.${booking.paymentMethod || 'online'}`) })}
      </span>
    );
  }
  if (booking.paymentStatus === 'refunded') return <span className="badge badge-busy">{t('booking.refunded')}</span>;
  if (['requested', 'accepted', 'in_progress'].includes(booking.status)) return <span className="badge badge-outline">{t('booking.unpaid')}</span>;
  return null;
}
