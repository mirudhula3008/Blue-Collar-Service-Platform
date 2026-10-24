import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { AccountStatusBadge, FilterChips, Pager, SearchBox, shortDate, useDebounced } from '../components/AdminUi';
import { listWorkers } from '../api/admin';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

const FILTERS = [
  { id: 'all', label: 'admin.all' },
  { id: 'active', label: 'admin.status.active' },
  { id: 'under_review', label: 'admin.status.under_review' },
  { id: 'suspended', label: 'admin.status.suspended' },
  { id: 'blocked', label: 'admin.status.blocked' },
];

// /admin/workers — every worker with job/earnings totals and account status.
export default function AdminWorkers() {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const page = Number(params.get('page')) || 1;
  const [search, setSearch] = useState(params.get('search') || '');
  const debounced = useDebounced(search);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v && v !== 'all' ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (debounced !== (params.get('search') || '')) update({ search: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = params.toString();
  useEffect(() => {
    let cancelled = false;
    listWorkers({ status, search: params.get('search') || undefined, page, limit: 20 })
      .then((res) => !cancelled && (setData(res), setError(null)))
      .catch((err) => !cancelled && setError(errorMessage(err, t('discovery.loadError'))));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <AdminLayout title={t('nav.workers')}>
      <div className="flex flex-col gap-4">
        <SearchBox value={search} onChange={setSearch} placeholder={t('admin.searchPlaceholder')} />
        <FilterChips label={t('admin.accountStatus')} options={FILTERS.map((f) => ({ ...f, label: t(f.label) }))} value={status} onChange={(v) => update({ status: v })} />
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}

      <div className="card mt-5 overflow-hidden">
        {!data ? (
          <div className="m-5 h-64 animate-pulse rounded-xl bg-slate-100" />
        ) : data.workers.length === 0 ? (
          <p className="p-8 text-center text-slate-500">{t('admin.noWorkers')}</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">{t('nav.roles.worker')}</th>
                    <th className="px-5 py-3">{t('filter.category')}</th>
                    <th className="px-5 py-3">{t('worker.rating')}</th>
                    <th className="px-5 py-3 text-right">{t('nav.jobs')}</th>
                    <th className="px-5 py-3 text-right">{t('nav.earnings')}</th>
                    <th className="px-5 py-3">{t('admin.statusCol')}</th>
                    <th className="px-5 py-3">{t('admin.joined')}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.workers.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-navy">{w.name}</p>
                        <p className="text-xs text-slate-500">{w.email}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{t(`services.${w.serviceCategory}`)}</td>
                      <td className="px-5 py-3 tabular-nums text-slate-600">
                        {w.averageRating ? `${w.averageRating.toFixed(1)} ★` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{w.totalJobs}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{formatPrice(w.totalEarnings)}</td>
                      <td className="px-5 py-3">
                        <AccountStatusBadge status={w.accountStatus} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{shortDate(w.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/admin/workers/${w._id}`} className="btn btn-secondary btn-sm">
                          {t('admin.manage')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {data.workers.map((w) => (
                <li key={w._id}>
                  <Link to={`/admin/workers/${w._id}`} className="flex items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-navy">{w.name}</p>
                        <AccountStatusBadge status={w.accountStatus} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {t(`services.${w.serviceCategory}`)} · {w.totalJobs} {t('earnings.jobs')} · {formatPrice(w.totalEarnings)}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>

            <Pager page={data.page} pages={data.pages} total={data.total} noun="worker" onPage={(p) => update({ page: String(p) })} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
