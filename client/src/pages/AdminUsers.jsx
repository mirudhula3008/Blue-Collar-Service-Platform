import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { RoleBadge } from './AdminDashboard';
import { listUsers, setWorkerVerification } from '../api/admin';
import { errorMessage } from '../api/client';
import { formatDate } from '../utils/format';

const PER_PAGE = 20;
const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

export default function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const role = params.get('role') || '';
  const verified = params.get('verified') || '';
  const page = Number(params.get('page')) || 1;

  const [search, setSearch] = useState(params.get('search') || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  // Debounce typing into the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== (params.get('search') || '')) updateParam('search', search.trim());
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const query = params.toString();
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listUsers({
      role: role || undefined,
      verified: verified || undefined,
      search: params.get('search') || undefined,
      page,
      limit: PER_PAGE,
    })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load users.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const toggleVerification = async (user) => {
    const next = !user.isVerified;
    if (next && !user.idProofUrl && !window.confirm(`${user.name} has not uploaded an ID proof. Verify anyway?`)) return;
    if (!next && !window.confirm(`Remove verification for ${user.name}? They will disappear from customer search.`)) return;

    setBusyId(user._id);
    try {
      const updated = await setWorkerVerification(user._id, next);
      setData((d) => ({
        ...d,
        users: d.users.map((u) => (u._id === updated._id ? { ...u, isVerified: updated.isVerified } : u)),
      }));
    } catch (err) {
      window.alert(errorMessage(err, 'Could not update verification.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout title="Users & verification">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or phone"
          aria-label="Search users"
          className={`${selectClass} sm:flex-1`}
        />
        <select value={role} onChange={(e) => updateParam('role', e.target.value)} className={selectClass} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="worker">Workers</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={verified}
          onChange={(e) => updateParam('verified', e.target.value)}
          className={selectClass}
          aria-label="Filter by verification"
        >
          <option value="">Any verification</option>
          <option value="false">Pending verification</option>
          <option value="true">Verified workers</option>
        </select>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

      <div className={`mt-4 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
        {!data && loading && <div className="h-64 animate-pulse rounded-xl bg-slate-200" />}

        {data && data.users.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No users match these filters.
          </div>
        )}

        {data && data.users.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">ID proof</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users.map((u) => (
                    <tr key={u._id} className="align-middle">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{u.serviceCategory || '—'}</td>
                      <td className="px-4 py-3">
                        <IdProofLink user={u} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <VerifyControl user={u} busy={busyId === u._id} onToggle={toggleVerification} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {data.users.map((u) => (
                <li key={u._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{u.name}</p>
                      <p className="truncate text-sm text-slate-500">{u.email}</p>
                      <p className="text-sm text-slate-500">{u.phone}</p>
                    </div>
                    <span className="text-xs">
                      <RoleBadge role={u.role} />
                    </span>
                  </div>
                  {u.role === 'worker' && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="capitalize text-slate-600">{u.serviceCategory}</span>
                      <IdProofLink user={u} />
                      <VerifyControl user={u} busy={busyId === u._id} onToggle={toggleVerification} />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                {data.total} user{data.total === 1 ? '' : 's'} · page {data.page} of {Math.max(data.pages, 1)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateParam('page', String(page - 1))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  disabled={page >= data.pages}
                  onClick={() => updateParam('page', String(page + 1))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function IdProofLink({ user }) {
  if (user.role !== 'worker') return <span className="text-slate-300">—</span>;
  if (!user.idProofUrl) return <span className="text-xs font-medium text-rose-600">Not uploaded</span>;
  return (
    <a href={user.idProofUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
      View ↗
    </a>
  );
}

function VerifyControl({ user, busy, onToggle }) {
  if (user.role !== 'worker') return <span className="text-slate-300">—</span>;
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          user.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}
      >
        {user.isVerified ? 'Verified' : 'Pending'}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => onToggle(user)}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
          user.isVerified
            ? 'border border-slate-300 bg-white text-slate-700 hover:border-rose-400 hover:text-rose-700'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {busy ? '…' : user.isVerified ? 'Unverify' : 'Verify'}
      </button>
    </div>
  );
}
