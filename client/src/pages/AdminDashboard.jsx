import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ClipboardList, Flag, IndianRupee, MessageSquareText, ShieldCheck, UserCheck, Users } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { AccountStatusBadge, dateTime } from '../components/AdminUi';
import { getAdminDashboard, getAdminStats } from '../api/admin';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';

const BOOKING_LABELS = {
  requested: 'Requested',
  accepted: 'Accepted',
  in_progress: 'In progress',
  completed: 'Completed',
  rejected: 'Declined',
  cancelled: 'Cancelled',
  cancelled_by_admin: 'Cancelled by admin',
};

export default function AdminDashboard() {
  const [dash, setDash] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    Promise.all([getAdminDashboard(), getAdminStats()])
      .then(([d, s]) => {
        setDash(d);
        setStats(s);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err, 'Could not load platform stats.')))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(load, [load]);

  const refresh = (
    <button type="button" onClick={load} disabled={refreshing} className="btn btn-secondary btn-sm">
      {refreshing ? 'Refreshing…' : '↻ Refresh'}
    </button>
  );

  return (
    <AdminLayout title="Platform overview" actions={refresh}>
      {error && <p className="mb-6 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}

      {!dash ? (
        !error && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              Icon={Users}
              label="Total users"
              value={dash.totalUsers}
              detail={`${dash.totalCustomers} customers · ${dash.totalWorkers} workers`}
            />
            <StatTile
              Icon={UserCheck}
              label="Active workers"
              value={dash.activeWorkers}
              detail={
                <Link to="/admin/workers" className="font-medium text-blue-600 hover:underline">
                  {dash.suspendedWorkers} suspended · {dash.blockedWorkers} blocked · {dash.underReviewWorkers} in review
                </Link>
              }
            />
            <StatTile
              Icon={ClipboardList}
              label="Bookings"
              value={dash.totalBookings}
              detail={`${dash.activeBookings} active · ${dash.completedBookings} completed`}
            />
            <StatTile
              Icon={IndianRupee}
              label="Revenue (completed jobs)"
              value={formatPrice(dash.totalRevenue)}
              detail={`${formatPrice(dash.totalCommission)} platform commission`}
            />
            <StatTile
              Icon={CalendarCheck}
              label="Today"
              value={formatPrice(dash.todayRevenue)}
              detail={`${dash.todayBookings} new booking${dash.todayBookings === 1 ? '' : 's'}`}
            />
            <StatTile
              Icon={ShieldCheck}
              label="Pending verification"
              value={dash.pendingVerification}
              highlight={dash.pendingVerification > 0}
              detail={
                dash.pendingVerification ? (
                  <Link to="/admin/users?verified=false" className="font-medium text-blue-600 hover:underline">
                    Review ID proofs →
                  </Link>
                ) : (
                  'All caught up'
                )
              }
            />
            <StatTile Icon={MessageSquareText} label="Jobs awaiting review" value={dash.pendingReviews} detail="Completed, not yet rated" />
            <StatTile
              Icon={Flag}
              label="Account flags (7 days)"
              value={dash.recentComplaints}
              highlight={dash.recentComplaints > 0}
              detail="Workers suspended, blocked or put under review"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Recent account actions">
              {dash.recentStatusActions.length === 0 ? (
                <p className="text-sm text-slate-500">No worker status changes yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {dash.recentStatusActions.map((a) => (
                    <li key={`${a.workerId}-${a.changedAt}`} className="py-3 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link to={`/admin/workers/${a.workerId}`} className="font-medium text-navy hover:text-blue-700">
                          {a.workerName}
                        </Link>
                        <AccountStatusBadge status={a.status} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">“{a.reason}”</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {a.adminName || 'Admin'} · {dateTime(a.changedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Bookings by status">
              {stats.bookings.total === 0 ? (
                <p className="text-sm text-slate-500">No bookings yet.</p>
              ) : (
                <BarList rows={Object.entries(BOOKING_LABELS).map(([key, label]) => ({ label, value: stats.bookings.byStatus[key] || 0 }))} />
              )}
            </Panel>
          </div>

          <Panel title="Workers by category">
            <BarList rows={stats.workers.byCategory.map((c) => ({ label: c.category, value: c.count }))} />
          </Panel>
        </div>
      )}
    </AdminLayout>
  );
}

function StatTile({ Icon, label, value, detail, highlight }) {
  return (
    <div className={`card p-5 ${highlight ? 'border-amber-300 bg-amber-50/40' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <Icon size={18} className={highlight ? 'text-amber-600' : 'text-blue-600'} aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-navy sm:text-3xl">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 font-semibold text-navy">{title}</h2>
      {children}
    </section>
  );
}

// Single-hue horizontal bars: magnitude only, labelled with the value.
function BarList({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate capitalize text-slate-600">{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="text-right font-medium tabular-nums text-slate-800">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    customer: 'bg-blue-50 text-blue-700',
    worker: 'bg-emerald-50 text-emerald-700',
    admin: 'bg-navy text-white',
  };
  return <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${styles[role] || ''}`}>{role}</span>;
}
