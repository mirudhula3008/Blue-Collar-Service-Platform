import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ClipboardList, Flag, IndianRupee, MessageSquareText, ShieldCheck, UserCheck, Users } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { AccountStatusBadge, dateTime } from '../components/AdminUi';
import { getAdminDashboard, getAdminStats } from '../api/admin';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

const BOOKING_STATUSES = ['requested', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled', 'cancelled_by_admin'];

export default function AdminDashboard() {
  const { t } = useLanguage();
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
      .catch((err) => setError(errorMessage(err, t('admin.statsFailed'))))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(load, [load]);

  const refresh = (
    <button type="button" onClick={load} disabled={refreshing} className="btn btn-secondary btn-sm">
      {refreshing ? t('common.refreshing') : t('common.refresh')}
    </button>
  );

  return (
    <AdminLayout title={t('admin.overviewTitle')} actions={refresh}>
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
              label={t('admin.totalUsers')}
              value={dash.totalUsers}
              detail={t('admin.usersDetail', { customers: dash.totalCustomers, workers: dash.totalWorkers })}
            />
            <StatTile
              Icon={UserCheck}
              label={t('admin.activeWorkers')}
              value={dash.activeWorkers}
              detail={
                <Link to="/admin/workers" className="font-medium text-blue-600 hover:underline">
                  {t('admin.workersDetail', { suspended: dash.suspendedWorkers, blocked: dash.blockedWorkers, review: dash.underReviewWorkers })}
                </Link>
              }
            />
            <StatTile
              Icon={ClipboardList}
              label={t('nav.bookings')}
              value={dash.totalBookings}
              detail={t('admin.bookingsDetail', { active: dash.activeBookings, completed: dash.completedBookings })}
            />
            <StatTile
              Icon={IndianRupee}
              label={t('admin.revenue')}
              value={formatPrice(dash.totalRevenue)}
              detail={t('admin.commissionDetail', { amount: formatPrice(dash.totalCommission) })}
            />
            <StatTile
              Icon={CalendarCheck}
              label={t('earnings.today')}
              value={formatPrice(dash.todayRevenue)}
              detail={t('admin.newBookings', { count: dash.todayBookings })}
            />
            <StatTile
              Icon={ShieldCheck}
              label={t('admin.pendingVerification')}
              value={dash.pendingVerification}
              highlight={dash.pendingVerification > 0}
              detail={
                dash.pendingVerification ? (
                  <Link to="/admin/users?verified=false" className="font-medium text-blue-600 hover:underline">
                    {t('admin.reviewIdProofs')}
                  </Link>
                ) : (
                  t('admin.allCaughtUp')
                )
              }
            />
            <StatTile
              Icon={MessageSquareText}
              label={t('admin.awaitingReview')}
              value={dash.pendingReviews}
              detail={t('admin.awaitingReviewDetail')}
            />
            <StatTile
              Icon={Flag}
              label={t('admin.flags')}
              value={dash.recentComplaints}
              highlight={dash.recentComplaints > 0}
              detail={t('admin.flagsDetail')}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title={t('admin.recentActions')}>
              {dash.recentStatusActions.length === 0 ? (
                <p className="text-sm text-slate-500">{t('admin.noActions')}</p>
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
                        {a.adminName || t('nav.roles.admin')} · {dateTime(a.changedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title={t('admin.bookingsByStatus')}>
              {stats.bookings.total === 0 ? (
                <p className="text-sm text-slate-500">{t('booking.noBookings')}</p>
              ) : (
                <BarList rows={BOOKING_STATUSES.map((key) => ({ label: t(`booking.status.${key}`), value: stats.bookings.byStatus[key] || 0 }))} />
              )}
            </Panel>
          </div>

          <Panel title={t('admin.workersByCategory')}>
            <BarList rows={stats.workers.byCategory.map((c) => ({ label: t(`services.${c.category}`), value: c.count }))} />
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
  const { t } = useLanguage();
  const styles = {
    customer: 'bg-blue-50 text-blue-700',
    worker: 'bg-emerald-50 text-emerald-700',
    admin: 'bg-navy text-white',
  };
  return <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${styles[role] || ''}`}>{t(`nav.roles.${role}`)}</span>;
}
