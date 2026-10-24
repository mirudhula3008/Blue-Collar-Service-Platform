import { useState } from 'react';
import { Link } from 'react-router-dom';
import BookingCard, { buttonStyles } from '../components/BookingCard';
import usePolling from '../hooks/usePolling';
import { getWorkerBookings, updateBookingStatus } from '../api/bookings';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';
import { scheduleKey } from '../utils/bookings';

// Worker's accepted and in-progress jobs, plus recent history.
export default function WorkerJobs() {
  const [busyId, setBusyId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const { data, setData, error, loading } = usePolling(() => getWorkerBookings(), 30000);

  const act = async (booking, action) => {
    if (action === 'complete' && !window.confirm('Mark this job as completed?')) return;
    setBusyId(booking._id);
    try {
      const updated = await updateBookingStatus(booking._id, action);
      setData((list) => list.map((b) => (b._id === updated._id ? updated : b)));
    } catch (err) {
      window.alert(errorMessage(err, 'Could not update the job.'));
    } finally {
      setBusyId(null);
    }
  };

  const all = data || [];
  const inProgress = all.filter((b) => b.status === 'in_progress');
  const accepted = all.filter((b) => b.status === 'accepted').sort((a, b) => scheduleKey(a).localeCompare(scheduleKey(b)));
  const history = all
    .filter((b) => ['completed', 'rejected', 'cancelled'].includes(b.status))
    .sort((a, b) => scheduleKey(b).localeCompare(scheduleKey(a)));
  const earned = all.filter((b) => b.status === 'completed').reduce((sum, b) => sum + b.agreedPrice, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">My jobs</h1>
        <Link to="/worker/dashboard" className={buttonStyles.ghost}>
          ← Incoming requests
        </Link>
      </div>

      {data && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="In progress" value={inProgress.length} />
          <Stat label="Upcoming" value={accepted.length} />
          <Stat label="Earned" value={formatPrice(earned)} />
        </div>
      )}

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading && !data && <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-200" />}

      {data && (
        <>
          <Section title="In progress" empty="Nothing in progress.">
            {inProgress.map((b) => (
              <BookingCard key={b._id} booking={b} viewer="worker" showMap>
                <button type="button" className={buttonStyles.success} disabled={busyId === b._id} onClick={() => act(b, 'complete')}>
                  {busyId === b._id ? 'Saving…' : '✓ Mark as completed'}
                </button>
              </BookingCard>
            ))}
          </Section>

          <Section title="Upcoming" empty="No upcoming jobs. Accepted requests appear here.">
            {accepted.map((b) => (
              <BookingCard key={b._id} booking={b} viewer="worker" showMap>
                <button type="button" className={buttonStyles.primary} disabled={busyId === b._id} onClick={() => act(b, 'start')}>
                  {busyId === b._id ? 'Starting…' : '▶ Start job'}
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
              {showHistory ? '▾ Hide' : '▸ Show'} past jobs ({history.length})
            </button>
            {showHistory && (
              <div className="mt-4 space-y-4">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">No past jobs yet.</p>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
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
