import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import { FilterChips, Pager } from '../components/AdminUi';
import { listAllBookings } from '../api/admin';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';
import { formatScheduleDate, formatTime } from '../utils/bookings';
import { useLanguage } from '../context/LanguageContext';

const FILTERS = [
  { id: 'all', label: 'admin.all' },
  { id: 'requested', label: 'booking.status.requested' },
  { id: 'accepted', label: 'booking.status.accepted' },
  { id: 'in_progress', label: 'booking.status.in_progress' },
  { id: 'completed', label: 'booking.status.completed' },
  { id: 'cancelled', label: 'booking.status.cancelled' },
];

function PaymentCell({ b }) {
  const { t } = useLanguage();
  if (b.paymentStatus === 'paid') {
    return (
      <span className={`badge ${b.paymentMethod === 'cash' ? 'badge-negotiable' : 'badge-verified'}`}>
        {b.paymentMethod === 'cash' ? t('booking.methods.cash') : t('booking.paidVia', { method: t(`booking.methods.${b.paymentMethod || 'online'}`) })}
      </span>
    );
  }
  if (b.paymentStatus === 'refunded') return <span className="badge badge-busy">{t('booking.refunded')}</span>;
  return <span className="badge badge-outline">{t('booking.unpaid')}</span>;
}

// /admin/bookings
export default function AdminBookings() {
  const { t } = useLanguage();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listAllBookings({ status, page, limit: 20 })
      .then((res) => !cancelled && (setData(res), setError(null)))
      .catch((err) => !cancelled && setError(errorMessage(err, t('common.loadError'))));
    return () => {
      cancelled = true;
    };
  }, [status, page]);

  return (
    <AdminLayout title={t('nav.bookings')}>
      <FilterChips
        label={t('admin.bookingStatus')}
        options={FILTERS.map((f) => ({ ...f, label: t(f.label) }))}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />
      {error && <p className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}

      <div className="card mt-5 overflow-hidden">
        {!data ? (
          <div className="m-5 h-64 animate-pulse rounded-xl bg-slate-100" />
        ) : data.bookings.length === 0 ? (
          <p className="p-8 text-center text-slate-500">{t('admin.noBookings')}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">{t('payment.when')}</th>
                    <th className="px-5 py-3">{t('payment.service')}</th>
                    <th className="px-5 py-3">{t('admin.customerToWorker')}</th>
                    <th className="px-5 py-3 text-right">{t('payment.amount')}</th>
                    <th className="px-5 py-3">{t('payment.title')}</th>
                    <th className="px-5 py-3">{t('admin.statusCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.bookings.map((b) => (
                    <tr key={b._id}>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                        {formatScheduleDate(b.scheduledDate)}
                        <span className="block text-xs">{formatTime(b.scheduledTime)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-navy">{b.serviceName}</p>
                        <p className="text-xs text-slate-500">{t(`services.${b.serviceCategory}`)}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {b.customerId?.name || '—'} →{' '}
                        {b.workerId ? (
                          <Link to={`/admin/workers/${b.workerId._id}`} className="font-medium text-blue-600 hover:underline">
                            {b.workerId.name}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{formatPrice(b.agreedPrice)}</td>
                      <td className="px-5 py-3">
                        <PaymentCell b={b} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} pages={data.pages} total={data.total} noun="booking" onPage={setPage} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
