import { useEffect, useState } from 'react';
import { CalendarDays, Clock, IndianRupee, Percent, Star, TrendingUp, Wallet } from 'lucide-react';
import EarningsChart from '../components/EarningsChart';
import { getEarningsHistory, getEarningsSummary, getEarningsTransactions } from '../api/earnings';
import { errorMessage } from '../api/client';
import { useLanguage, getLocale } from '../context/LanguageContext';
import { formatDate, formatPrice } from '../utils/format';

const PERIODS = [
  { id: 'daily', label: 'earnings.last7Days' },
  { id: 'weekly', label: 'earnings.last4Weeks' },
  { id: 'monthly', label: 'earnings.last6Months' },
];
const PER_PAGE = 10;

// Chart labels are formatted here (from each bucket's start date) so they follow the selected language.
function periodLabel(entry, period, isLast, t) {
  const date = new Date(entry.start);
  const opts = { timeZone: 'Asia/Kolkata' };
  if (period === 'monthly') return date.toLocaleDateString(getLocale(), { ...opts, month: 'short' });
  const day = date.toLocaleDateString(getLocale(), { ...opts, day: 'numeric', month: 'short' });
  if (period === 'weekly') return isLast ? t('earnings.thisWeek') : t('earnings.weekOf', { date: day });
  return day;
}

const methodText = (row, t) => (row.method === 'card' ? row.methodLabel : t(`booking.methods.${row.method}`));

// /worker/earnings — income, platform commission and payouts for the logged-in worker.
export default function EarningsDashboard() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [history, setHistory] = useState(null);
  const [tx, setTx] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEarningsSummary()
      .then(setSummary)
      .catch((err) => setError(errorMessage(err, t('earnings.loadFailed'))));
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
      <p className="eyebrow">{t('earnings.eyebrow')}</p>
      <h1 className="mt-1 font-display text-3xl text-navy sm:text-4xl">{t('nav.earnings')}</h1>
      <p className="mt-1 text-slate-500">
        {t('earnings.intro', { rate })}
      </p>

      {/* Period cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary
          ? [
              ['earnings.today', summary.today, Clock],
              ['earnings.thisWeek', summary.thisWeek, CalendarDays],
              ['earnings.thisMonth', summary.thisMonth, TrendingUp],
              ['earnings.lifetime', summary.totalLifetime, IndianRupee],
            ].map(([label, p, Icon]) => (
              <div key={label} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="caption">{t(label)}</p>
                  <Icon size={18} className="text-blue-600" aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-navy sm:text-3xl">{formatPrice(p.net)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {t('earnings.earnedJobs', { amount: formatPrice(p.earnings), count: p.jobs })}
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
            label={t('earnings.pending')}
            value={formatPrice(summary.pendingPayouts)}
            note={t('earnings.pendingNote')}
          />
          <MiniStat
            Icon={Percent}
            label={t('earnings.platformCommission', { rate })}
            value={formatPrice(summary.platformCommission)}
            note={t('earnings.lifetimeTotal')}
          />
          <MiniStat Icon={IndianRupee} label={t('earnings.avgJobValue')} value={formatPrice(summary.averageJobValue)} note={t('earnings.beforeCommission')} />
          <MiniStat
            Icon={Star}
            label={t('earnings.avgRating')}
            value={summary.averageRating ? `${summary.averageRating.toFixed(1)} ★` : t('worker.new')}
            note={t('review.count', { count: summary.totalReviews })}
          />
        </div>
      )}

      {summary?.awaitingCompletion?.jobs > 0 && (
        <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {t('earnings.awaiting', { amount: formatPrice(summary.awaitingCompletion.amount), count: summary.awaitingCompletion.jobs })}
        </p>
      )}

      {/* Chart */}
      <section className="card mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-navy">{t('earnings.overTime')}</h2>
            <p className="text-sm text-slate-500">{t('earnings.chartHint')}</p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label={t('earnings.chartPeriod')}>
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
                {t(p.label)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          {history ? (
            <EarningsChart data={history.map((entry, i) => ({ ...entry, label: periodLabel(entry, period, i === history.length - 1, t) }))} />
          ) : <div className="h-56 animate-pulse rounded-xl bg-slate-100" />}
        </div>
      </section>

      {/* Transactions */}
      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-2xl text-navy">{t('earnings.transactions')}</h2>
          {tx && <span className="text-sm text-slate-500">{t('earnings.completedJobs', { count: tx.total })}</span>}
        </div>

        {!tx ? (
          <div className="m-5 h-40 animate-pulse rounded-xl bg-slate-100" />
        ) : tx.transactions.length === 0 ? (
          <p className="p-8 text-center text-slate-500">{t('earnings.noTransactions')}</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">{t('earnings.col.date')}</th>
                    <th className="px-5 py-3">{t('earnings.col.job')}</th>
                    <th className="px-5 py-3">{t('payment.method')}</th>
                    <th className="px-5 py-3 text-right">{t('payment.amount')}</th>
                    <th className="px-5 py-3 text-right">{t('earnings.col.commission')}</th>
                    <th className="px-5 py-3 text-right">{t('earnings.col.youGet')}</th>
                    <th className="px-5 py-3">{t('earnings.col.payout')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tx.transactions.map((row) => (
                    <tr key={row._id}>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(row.earnedAt)}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-navy">{row.serviceName}</p>
                        <p className="text-xs text-slate-500">{row.customerName}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{methodText(row, t)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{formatPrice(row.amount)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-400">−{formatPrice(row.commission)}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-navy">{formatPrice(row.net)}</td>
                      <td className="px-5 py-3">
                        <PayoutBadge settled={row.settled} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {tx.transactions.map((row) => (
                <li key={row._id} className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">{row.serviceName}</p>
                    <p className="text-xs text-slate-500">
                      {row.customerName} · {formatDate(row.earnedAt)} · {methodText(row, t)}
                    </p>
                    <div className="mt-1.5">
                      <PayoutBadge settled={row.settled} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-navy">{formatPrice(row.net)}</p>
                    <p className="text-xs tabular-nums text-slate-400">{t('earnings.ofAmount', { amount: formatPrice(row.amount) })}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
              <span>
                {t('common.pageOf', { page: tx.page, pages: Math.max(tx.pages, 1) })}
              </span>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t('common.prev')}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={page >= tx.pages} onClick={() => setPage((p) => p + 1)}>
                  {t('common.nextPage')}
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
  const { t } = useLanguage();
  return settled ? (
    <span className="badge badge-verified">{t('earnings.paidOut')}</span>
  ) : (
    <span className="badge badge-negotiable">{t('earnings.payoutPending')}</span>
  );
}
