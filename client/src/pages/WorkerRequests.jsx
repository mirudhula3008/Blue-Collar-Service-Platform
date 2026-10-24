import { useState } from 'react';
import { Link } from 'react-router-dom';
import BookingCard, { buttonStyles } from '../components/BookingCard';
import usePolling from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getWorkerBookings, updateBookingStatus } from '../api/bookings';
import { errorMessage } from '../api/client';
import { scheduleKey } from '../utils/bookings';

const POLL_MS = 15000;

// Worker dashboard: incoming booking requests, refreshed every 15 seconds.
export default function WorkerRequests() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(null); // `${id}:${action}`
  const { data, setData, error, loading } = usePolling(() => getWorkerBookings(), POLL_MS);

  const act = async (booking, action) => {
    if (action === 'reject' && !window.confirm(t('requests.confirmDecline', { name: booking.customerId?.name || t('nav.roles.customer') }))) return;
    setBusy(`${booking._id}:${action}`);
    try {
      const updated = await updateBookingStatus(booking._id, action);
      setData((list) => list.map((b) => (b._id === updated._id ? updated : b)));
    } catch (err) {
      window.alert(errorMessage(err, t('requests.updateFailed')));
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
          <h1 className="font-display text-3xl sm:text-4xl text-navy">{t('requests.title')}</h1>
          <p className="text-sm text-slate-500">{t('requests.autoUpdate', { seconds: POLL_MS / 1000 })}</p>
        </div>
        <Link to="/worker/jobs" className={buttonStyles.ghost}>
          {t('requests.myJobs')}{upcoming ? ` (${upcoming})` : ''} →
        </Link>
      </div>

      {user.accountStatus && user.accountStatus !== 'active' && (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {t('requests.accountRestricted', { status: t(`admin.status.${user.accountStatus}`) })}
        </p>
      )}
      {!user.isVerified && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⏳ {t('requests.awaitingVerification')}
        </p>
      )}
      {user.availability === false && (
        <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {t('requests.unavailable')}{' '}
          <Link to="/profile" className="font-medium text-blue-600 hover:underline">
            {t('requests.changeAvailability')}
          </Link>
        </p>
      )}

      <div className="mt-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        {loading && !data && <div className="h-40 animate-pulse rounded-xl bg-slate-200" />}

        {data && requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            {t('requests.none')}
          </div>
        )}

        {requests.map((b) => (
          <BookingCard key={b._id} booking={b} viewer="worker" showMap>
            <button type="button" className={buttonStyles.success} disabled={Boolean(busy)} onClick={() => act(b, 'accept')}>
              {busy === `${b._id}:accept` ? t('requests.accepting') : `✓ ${t('requests.accept')}`}
            </button>
            <button type="button" className={buttonStyles.danger} disabled={Boolean(busy)} onClick={() => act(b, 'reject')}>
              {busy === `${b._id}:reject` ? t('requests.declining') : t('requests.decline')}
            </button>
          </BookingCard>
        ))}
      </div>
    </div>
  );
}
