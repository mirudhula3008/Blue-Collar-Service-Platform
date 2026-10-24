import { useState } from 'react';
import { Link } from 'react-router-dom';
import BookingCard, { buttonStyles } from '../components/BookingCard';
import usePolling from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import { getWorkerBookings, updateBookingStatus } from '../api/bookings';
import { errorMessage } from '../api/client';
import { scheduleKey } from '../utils/bookings';

const POLL_MS = 15000;

// Worker dashboard: incoming booking requests, refreshed every 15 seconds.
export default function WorkerRequests() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(null); // `${id}:${action}`
  const { data, setData, error, loading } = usePolling(() => getWorkerBookings(), POLL_MS);

  const act = async (booking, action) => {
    if (action === 'reject' && !window.confirm(`Decline the request from ${booking.customerId?.name || 'this customer'}?`)) return;
    setBusy(`${booking._id}:${action}`);
    try {
      const updated = await updateBookingStatus(booking._id, action);
      setData((list) => list.map((b) => (b._id === updated._id ? updated : b)));
    } catch (err) {
      window.alert(errorMessage(err, 'Could not update the booking.'));
    } finally {
      setBusy(null);
    }
  };

  const requests = (data || []).filter((b) => b.status === 'requested').sort((a, b) => scheduleKey(a).localeCompare(scheduleKey(b)));
  const upcoming = (data || []).filter((b) => ['accepted', 'in_progress'].includes(b.status)).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-navy">Incoming requests</h1>
          <p className="text-sm text-slate-500">Updates automatically every {POLL_MS / 1000} seconds.</p>
        </div>
        <Link to="/worker/jobs" className={buttonStyles.ghost}>
          My jobs{upcoming ? ` (${upcoming})` : ''} →
        </Link>
      </div>

      {!user.isVerified && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⏳ Your account is awaiting verification. Customers can’t find you until an admin verifies your ID proof.
        </p>
      )}
      {user.availability === false && (
        <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
          You’re marked as unavailable, so customers can’t send new requests.{' '}
          <Link to="/profile" className="font-medium text-blue-600 hover:underline">
            Change availability
          </Link>
        </p>
      )}

      <div className="mt-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        {loading && !data && <div className="h-40 animate-pulse rounded-xl bg-slate-200" />}

        {data && requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No new requests right now. New bookings will appear here automatically.
          </div>
        )}

        {requests.map((b) => (
          <BookingCard key={b._id} booking={b} viewer="worker" showMap>
            <button type="button" className={buttonStyles.success} disabled={Boolean(busy)} onClick={() => act(b, 'accept')}>
              {busy === `${b._id}:accept` ? 'Accepting…' : '✓ Accept'}
            </button>
            <button type="button" className={buttonStyles.danger} disabled={Boolean(busy)} onClick={() => act(b, 'reject')}>
              {busy === `${b._id}:reject` ? 'Declining…' : 'Decline'}
            </button>
          </BookingCard>
        ))}
      </div>
    </div>
  );
}
