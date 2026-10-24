import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getAdminStats } from '../api/admin';
import { errorMessage } from '../api/client';
import { formatDate } from '../utils/format';

const STATUS_STYLES = {
  requested: { label: 'Requested', bar: 'bg-sky-500' },
  accepted: { label: 'Accepted', bar: 'bg-indigo-500' },
  in_progress: { label: 'In progress', bar: 'bg-amber-500' },
  completed: { label: 'Completed', bar: 'bg-emerald-500' },
  rejected: { label: 'Rejected', bar: 'bg-rose-500' },
  cancelled: { label: 'Cancelled', bar: 'bg-slate-400' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    getAdminStats()
      .then((s) => {
        setStats(s);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err, 'Could not load platform stats.')))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(load, [load]);

  const refresh = (
    <button
      type="button"
      onClick={load}
      disabled={refreshing}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-400 disabled:opacity-60"
    >
      {refreshing ? 'Refreshing…' : '↻ Refresh'}
    </button>
  );

  return (
    <AdminLayout title="Platform overview" actions={refresh}>
      {error && <p className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

      {!stats ? (
        !error && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Total users" value={stats.users.total} detail={`${stats.users.customers} customers · ${stats.users.admins} admins`} />
            <StatTile label="Workers" value={stats.users.workers} detail={`${stats.workers.verified} verified`} />
            <StatTile
              label="Pending verification"
              value={stats.workers.pendingVerification}
              detail={
                stats.workers.pendingVerification ? (
                  <Link to="/admin/users?verified=false" className="font-medium text-blue-600 hover:underline">
                    Review now →
                  </Link>
                ) : (
                  'All caught up'
                )
              }
              highlight={stats.workers.pendingVerification > 0}
            />
            <StatTile
              label="Bookings"
              value={stats.bookings.total}
              detail={`${stats.reviews.total} reviews · ${stats.reviews.total ? `${stats.reviews.averageRating.toFixed(1)}★ avg` : 'no ratings'}`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Bookings by status">
              {stats.bookings.total === 0 ? (
                <p className="text-sm text-slate-500">No bookings yet.</p>
              ) : (
                <BarList
                  rows={Object.entries(STATUS_STYLES).map(([key, s]) => ({
                    label: s.label,
                    value: stats.bookings.byStatus[key] || 0,
                    bar: s.bar,
                  }))}
                />
              )}
            </Panel>

            <Panel title="Workers by category">
              {stats.workers.byCategory.length === 0 ? (
                <p className="text-sm text-slate-500">No workers yet.</p>
              ) : (
                <BarList
                  rows={stats.workers.byCategory.map((c) => ({ label: c.category, value: c.count, bar: 'bg-blue-500' }))}
                />
              )}
            </Panel>
          </div>

          <Panel title="Newest accounts">
            <ul className="divide-y divide-slate-100">
              {stats.recentUsers.map((u) => (
                <li key={u._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{u.name}</p>
                    <p className="truncate text-sm text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <RoleBadge role={u.role} />
                    <span className="text-slate-400">{formatDate(u.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </AdminLayout>
  );
}

function StatTile({ label, value, detail, highlight }) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${highlight ? 'border-amber-300' : 'border-slate-200'}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{value.toLocaleString('en-IN')}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function BarList({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate capitalize text-slate-600">{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="text-right font-medium tabular-nums text-slate-800">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    customer: 'bg-sky-50 text-sky-700',
    worker: 'bg-violet-50 text-violet-700',
    admin: 'bg-slate-800 text-white',
  };
  return <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${styles[role] || ''}`}>{role}</span>;
}
