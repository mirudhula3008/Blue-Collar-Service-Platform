import { useEffect, useState } from 'react';
import { CalendarDays, Clock, IndianRupee, Percent, Star, TrendingUp, Wallet } from 'lucide-react';
import EarningsChart from '../components/EarningsChart';
import { getEarningsHistory, getEarningsSummary, getEarningsTransactions } from '../api/earnings';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';

const PERIODS = [
  { id: 'daily', label: 'Last 7 days' },
  { id: 'weekly', label: 'Last 4 weeks' },
  { id: 'monthly', label: 'Last 6 months' },
];
const PER_PAGE = 10;

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// /worker/earnings — income, platform commission and payouts for the logged-in worker.
export default function EarningsDashboard() {
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [history, setHistory] = useState(null);
  const [tx, setTx] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEarningsSummary()
      .then(setSummary)
      .catch((err) => setError(errorMessage(err, 'Could not load earnings.')));
  }, []);

  useEffect(() => {
    setHistory(null);
    getEarningsHistory(period)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [period]);

  useEffect(() => {
    getEarningsTransactions(page, PER_PAGE)
      .then(setTx)
      .catch(() => setTx({ transactions: [], total: 0, pages: 0, page: 1 }));
  }, [page]);

  if (error) return <p className="mx-auto mt-10 max-w-xl rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>;

  const rate = Math.round((summary?.commissionRate ?? 0.1) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="eyebrow">Your money</p>
      <h1 className="mt-1 font-display text-3xl text-navy sm:text-4xl">Earnings</h1>
      <p className="mt-1 text-slate-500">
        Take-home amounts are after the {rate}% platform commission. Jobs count once they’re marked completed.
      </p>

      {/* Period cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary
          ? [
              ['Today', summary.today, Clock],
              ['This week', summary.thisWeek, CalendarDays],
              ['This month', summary.thisMonth, TrendingUp],
              ['Lifetime', summary.totalLifetime, IndianRupee],
            ].map(([label, p, Icon]) => (
              <div key={label} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="caption">{label}</p>
                  <Icon size={18} className="text-blue-600" aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-navy sm:text-3xl">{formatPrice(p.net)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatPrice(p.earnings)} earned · {p.jobs} job{p.jobs === 1 ? '' : 's'}
                </p>
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
      </div>

      {/* Secondary stats */}
      {summary && (
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniStat
            Icon={Wallet}
            tone="amber"
            label="Pending payout"
            value={formatPrice(summary.pendingPayouts)}
            note="Settled to you 7 days after each job"
          />
          <MiniStat
            Icon={Percent}
            label={`Platform commission (${rate}%)`}
            value={formatPrice(summary.platformCommission)}
            note="Lifetime total"
          />
          <MiniStat Icon={IndianRupee} label="Average job value" value={formatPrice(summary.averageJobValue)} note="Before commission" />
          <MiniStat
            Icon={Star}
            label="Average rating"
            value={summary.averageRating ? `${summary.averageRating.toFixed(1)} ★` : 'New'}
            note={`${summary.totalReviews} review${summary.totalReviews === 1 ? '' : 's'}`}
          />
        </div>
      )}

      {summary?.awaitingCompletion?.jobs > 0 && (
        <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {formatPrice(summary.awaitingCompletion.amount)} already paid by customers for {summary.awaitingCompletion.jobs} upcoming job
          {summary.awaitingCompletion.jobs === 1 ? '' : 's'}. It counts as earnings once you complete them.
        </p>
      )}

      {/* Chart */}
      <section className="card mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-navy">Earnings over time</h2>
            <p className="text-sm text-slate-500">Hover a bar for take-home pay and job count.</p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Chart period">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={period === p.id}
                onClick={() => setPeriod(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  period === p.id ? 'bg-white text-navy shadow-card' : 'text-slate-500 hover:text-navy'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          {history ? <EarningsChart data={history} /> : <div className="h-56 animate-pulse rounded-xl bg-slate-100" />}
        </div>
      </section>

      {/* Transactions */}
      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-2xl text-navy">Transactions</h2>
          {tx && <span className="text-sm text-slate-500">{tx.total} completed jobs</span>}
        </div>

        {!tx ? (
          <div className="m-5 h-40 animate-pulse rounded-xl bg-slate-100" />
        ) : tx.transactions.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No completed jobs yet. Finished jobs and their payouts will appear here.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Job</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Commission</th>
                    <th className="px-5 py-3 text-right">You get</th>
                    <th className="px-5 py-3">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tx.transactions.map((t) => (
                    <tr key={t._id}>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(t.earnedAt)}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-navy">{t.serviceName}</p>
                        <p className="text-xs text-slate-500">{t.customerName}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{t.methodLabel}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{formatPrice(t.amount)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-400">−{formatPrice(t.commission)}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-navy">{formatPrice(t.net)}</td>
                      <td className="px-5 py-3">
                        <PayoutBadge settled={t.settled} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {tx.transactions.map((t) => (
                <li key={t._id} className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">{t.serviceName}</p>
                    <p className="text-xs text-slate-500">
                      {t.customerName} · {formatDate(t.earnedAt)} · {t.methodLabel}
                    </p>
                    <div className="mt-1.5">
                      <PayoutBadge settled={t.settled} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-navy">{formatPrice(t.net)}</p>
                    <p className="text-xs tabular-nums text-slate-400">of {formatPrice(t.amount)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
              <span>
                Page {tx.page} of {Math.max(tx.pages, 1)}
              </span>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Prev
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={page >= tx.pages} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MiniStat({ Icon, label, value, note, tone }) {
  return (
    <div className={`card flex gap-3 p-4 ${tone === 'amber' ? 'border-amber-200 bg-amber-50' : ''}`}>
      <span
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
          tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'
        }`}
        aria-hidden="true"
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-lg font-bold tabular-nums text-navy">{value}</p>
        <p className="truncate text-xs text-slate-400">{note}</p>
      </div>
    </div>
  );
}

function PayoutBadge({ settled }) {
  return settled ? <span className="badge badge-verified">Paid out</span> : <span className="badge badge-negotiable">Pending</span>;
}
