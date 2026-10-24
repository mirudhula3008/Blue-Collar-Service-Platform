import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BookingCard, { buttonStyles } from '../components/BookingCard';
import usePolling from '../hooks/usePolling';
import { getCustomerBookings, updateBookingStatus } from '../api/bookings';
import { errorMessage } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { ACTIVE, scheduleKey } from '../utils/bookings';

const TABS = [
  { id: 'active', label: 'bookings.tabs.active', match: (b) => ACTIVE.includes(b.status) },
  { id: 'completed', label: 'bookings.tabs.completed', match: (b) => b.status === 'completed' },
  { id: 'cancelled', label: 'bookings.tabs.cancelled', match: (b) => ['cancelled', 'rejected', 'cancelled_by_admin'].includes(b.status) },
];

const EMPTY = {
  active: 'bookings.empty.active',
  completed: 'bookings.empty.completed',
  cancelled: 'bookings.empty.cancelled',
};

export default function MyBookings() {
  const { t } = useLanguage();
  const { state } = useLocation();
  const [tab, setTab] = useState('active');
  const [busyId, setBusyId] = useState(null);
  const { data: bookings, setData, error, loading } = usePolling(() => getCustomerBookings(), 30000);

  const cancel = async (booking) => {
    const refundNote = booking.paymentStatus === 'paid' && booking.paymentMethod !== 'cash' ? ` ${t('bookings.refundNote')}` : '';
    if (!window.confirm(`${t('bookings.confirmCancel', { name: booking.workerId?.name || t('payment.theWorker') })}${refundNote}`)) return;
    setBusyId(booking._id);
    try {
      const updated = await updateBookingStatus(booking._id, 'cancel');
      setData((list) => list.map((b) => (b._id === updated._id ? updated : b)));
    } catch (err) {
      window.alert(errorMessage(err, t('bookings.cancelFailed')));
    } finally {
      setBusyId(null);
    }
  };

  const current = TABS.find((item) => item.id === tab);
  const list = (bookings || []).filter(current.match);
  // Upcoming soonest first for active; most recent first otherwise.
  list.sort((a, b) => (tab === 'active' ? scheduleKey(a).localeCompare(scheduleKey(b)) : scheduleKey(b).localeCompare(scheduleKey(a))));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl sm:text-4xl text-navy">{t('nav.myBookings')}</h1>

      {state?.justBooked && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✅ {t('bookings.requestSent', { name: state.justBooked })}
        </p>
      )}

      <div className="mt-6 flex gap-1 border-b border-slate-200" role="tablist">
        {TABS.map((item) => {
          const count = (bookings || []).filter(item.match).length;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
                tab === item.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t(item.label)}
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
            {t(EMPTY[tab])}
            {tab === 'active' && (
              <div className="mt-3">
                <Link to="/dashboard" className="font-medium text-blue-600 hover:underline">
                  {t('bookings.browse')}
                </Link>
              </div>
            )}
          </div>
        )}

        {list.map((b) => (
          <BookingCard key={b._id} booking={b} viewer="customer">
            {['requested', 'accepted'].includes(b.status) && b.paymentStatus !== 'paid' && (
              <Link to={`/payment/${b._id}`} className="btn btn-amber btn-sm">
                {t('bookings.payNow')}
              </Link>
            )}
            {['requested', 'accepted'].includes(b.status) && (
              <button type="button" className={buttonStyles.danger} disabled={busyId === b._id} onClick={() => cancel(b)}>
                {busyId === b._id ? t('bookings.cancelling') : t('bookings.cancel')}
              </button>
            )}
            {b.status === 'completed' &&
              (b.reviewed ? (
                <span className="py-2 text-sm font-medium text-emerald-700">✓ {t('bookings.reviewed')}</span>
              ) : (
                <Link to={`/review/${b._id}`} state={{ booking: b }} className={buttonStyles.primary}>
                  ★ {t('bookings.leaveReview')}
                </Link>
              ))}
          </BookingCard>
        ))}
      </div>
    </div>
  );
}
