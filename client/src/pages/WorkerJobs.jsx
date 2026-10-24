import { useState } from 'react';
import { Link } from 'react-router-dom';
import BookingCard, { buttonStyles } from '../components/BookingCard';
import usePolling from '../hooks/usePolling';
import { getWorkerBookings, updateBookingStatus } from '../api/bookings';
import { errorMessage } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/format';
import { scheduleKey } from '../utils/bookings';

// Worker's accepted and in-progress jobs, plus recent history.
export default function WorkerJobs() {
  const { t } = useLanguage();
  const [busyId, setBusyId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const { data, setData, error, loading } = usePolling(() => getWorkerBookings(), 30000);

  const act = async (booking, action) => {
    if (action === 'complete' && !window.confirm(t('jobs.confirmComplete'))) return;
    setBusyId(booking._id);
    try {
      const updated = await updateBookingStatus(booking._id, action);
      setData((list) => list.map((b) => (b._id === updated._id ? updated : b)));
    } catch (err) {
      window.alert(errorMessage(err, t('jobs.updateFailed')));
    } finally {
      setBusyId(null);
    }
  };

  const all = data || [];
  const inProgress = all.filter((b) => b.status === 'in_progress');
  const accepted = all.filter((b) => b.status === 'accepted').sort((a, b) => scheduleKey(a).localeCompare(scheduleKey(b)));
  const history = all
    .filter((b) => ['completed', 'rejected', 'cancelled', 'cancelled_by_admin'].includes(b.status))
    .sort((a, b) => scheduleKey(b).localeCompare(scheduleKey(a)));
  const earned = all.filter((b) => b.status === 'completed').reduce((sum, b) => sum + b.agreedPrice, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl sm:text-4xl text-navy">{t('requests.myJobs')}</h1>
        <Link to="/worker/dashboard" className={buttonStyles.ghost}>
          ← {t('requests.title')}
        </Link>
      </div>

      {data && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label={t('booking.status.in_progress')} value={inProgress.length} />
          <Stat label={t('jobs.upcoming')} value={accepted.length} />
          <Stat label={t('jobs.earned')} value={formatPrice(earned)} />
        </div>
      )}

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading && !data && <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-200" />}

      {data && (
        <>
          <Section title={t('booking.status.in_progress')} empty={t('jobs.noneInProgress')}>
            {inProgress.map((b) => (
              <BookingCard key={b._id} booking={b} viewer="worker" showMap>
                <button type="button" className={buttonStyles.success} disabled={busyId === b._id} onClick={() => act(b, 'complete')}>
                  {busyId === b._id ? t('common.saving') : `✓ ${t('jobs.markCompleted')}`}
                </button>
              </BookingCard>
            ))}
          </Section>

          <Section title={t('jobs.upcoming')} empty={t('jobs.noneUpcoming')}>
            {accepted.map((b) => (
              <BookingCard key={b._id} booking={b} viewer="worker" showMap>
                <button type="button" className={buttonStyles.primary} disabled={busyId === b._id} onClick={() => act(b, 'start')}>
                  {busyId === b._id ? t('jobs.starting') : `▶ ${t('jobs.start')}`}
                </button>
              </BookingCard>
            ))}
          </Section>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowHistory((s) => !s)}
              className="text-sm font-medium text-blue-600 hover:underline"
              aria-expanded={showHistory}
            >
              {showHistory ? '▾' : '▸'} {t(showHistory ? 'jobs.hidePast' : 'jobs.showPast', { count: history.length })}
            </button>
            {showHistory && (
              <div className="mt-4 space-y-4">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('jobs.nonePast')}</p>
                ) : (
                  history.map((b) => <BookingCard key={b._id} booking={b} viewer="worker" />)
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Section({ title, empty, children }) {
  const items = [].concat(children).filter(Boolean);
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      <div className="space-y-4">{items.length ? items : <p className="text-sm text-slate-500">{empty}</p>}</div>
    </section>
  );
}
