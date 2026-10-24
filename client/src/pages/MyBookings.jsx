import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BookingCard, { buttonStyles } from '../components/BookingCard';
import usePolling from '../hooks/usePolling';
import { getCustomerBookings, updateBookingStatus } from '../api/bookings';
import { errorMessage } from '../api/client';
import { ACTIVE, scheduleKey } from '../utils/bookings';

const TABS = [
  { id: 'active', label: 'Active', match: (b) => ACTIVE.includes(b.status) },
  { id: 'completed', label: 'Completed', match: (b) => b.status === 'completed' },
  { id: 'cancelled', label: 'Cancelled', match: (b) => ['cancelled', 'rejected'].includes(b.status) },
];

const EMPTY = {
  active: 'No active bookings. Find a worker to get started.',
  completed: 'No completed jobs yet.',
  cancelled: 'No cancelled or declined bookings.',
};

export default function MyBookings() {
  const { state } = useLocation();
  const [tab, setTab] = useState('active');
  const [busyId, setBusyId] = useState(null);
  const { data: bookings, setData, error, loading } = usePolling(() => getCustomerBookings(), 30000);

  const cancel = async (booking) => {
    if (!window.confirm(`Cancel your booking with ${booking.workerId?.name || 'this worker'}?`)) return;
    setBusyId(booking._id);
    try {
      const updated = await updateBookingStatus(booking._id, 'cancel');
      setData((list) => list.map((b) => (b._id === updated._id ? updated : b)));
    } catch (err) {
      window.alert(errorMessage(err, 'Could not cancel the booking.'));
    } finally {
      setBusyId(null);
    }
  };

  const current = TABS.find((t) => t.id === tab);
  const list = (bookings || []).filter(current.match);
  // Upcoming soonest first for active; most recent first otherwise.
  list.sort((a, b) => (tab === 'active' ? scheduleKey(a).localeCompare(scheduleKey(b)) : scheduleKey(b).localeCompare(scheduleKey(a))));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>

      {state?.justBooked && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✅ Request sent to {state.justBooked}. You’ll see it here as <strong>Accepted</strong> once they confirm.
        </p>
      )}

      <div className="mt-6 flex gap-1 border-b border-slate-200" role="tablist">
        {TABS.map((t) => {
          const count = (bookings || []).filter(t.match).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
                tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
              {count > 0 && <span className="rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        {loading && !bookings && <div className="h-40 animate-pulse rounded-xl bg-slate-200" />}

        {bookings && list.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            {EMPTY[tab]}
            {tab === 'active' && (
              <div className="mt-3">
                <Link to="/dashboard" className="font-medium text-blue-600 hover:underline">
                  Browse services →
                </Link>
              </div>
            )}
          </div>
        )}

        {list.map((b) => (
          <BookingCard key={b._id} booking={b} viewer="customer">
            {['requested', 'accepted'].includes(b.status) && (
              <button type="button" className={buttonStyles.danger} disabled={busyId === b._id} onClick={() => cancel(b)}>
                {busyId === b._id ? 'Cancelling…' : 'Cancel booking'}
              </button>
            )}
            {b.status === 'completed' &&
              (b.reviewed ? (
                <span className="py-2 text-sm font-medium text-emerald-700">✓ Reviewed</span>
              ) : (
                <Link to={`/review/${b._id}`} state={{ booking: b }} className={buttonStyles.primary}>
                  ★ Leave a review
                </Link>
              ))}
          </BookingCard>
        ))}
      </div>
    </div>
  );
}
