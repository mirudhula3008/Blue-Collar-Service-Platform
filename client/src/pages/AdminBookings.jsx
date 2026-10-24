import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import { FilterChips, Pager } from '../components/AdminUi';
import { listAllBookings } from '../api/admin';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';
import { PAYMENT_METHOD_LABEL, formatScheduleDate, formatTime } from '../utils/bookings';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'requested', label: 'Requested' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function PaymentCell({ b }) {
  if (b.paymentStatus === 'paid') {
    return (
      <span className={`badge ${b.paymentMethod === 'cash' ? 'badge-negotiable' : 'badge-verified'}`}>
        {b.paymentMethod === 'cash' ? 'Cash' : `Paid · ${PAYMENT_METHOD_LABEL[b.paymentMethod] || ''}`}
      </span>
    );
  }
  if (b.paymentStatus === 'refunded') return <span className="badge badge-busy">Refunded</span>;
  return <span className="badge badge-outline">Unpaid</span>;
}

// /admin/bookings
export default function AdminBookings() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listAllBookings({ status, page, limit: 20 })
      .then((res) => !cancelled && (setData(res), setError(null)))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load bookings.')));
    return () => {
      cancelled = true;
    };
  }, [status, page]);

  return (
    <AdminLayout title="Bookings">
      <FilterChips
        label="Booking status"
        options={FILTERS}
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
          <p className="p-8 text-center text-slate-500">No bookings with this status.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">When</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Customer → Worker</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Status</th>
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
                        <p className="text-xs capitalize text-slate-500">{b.serviceCategory}</p>
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
