import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Pager, SearchBox, shortDate, useDebounced } from '../components/AdminUi';
import { listCustomers } from '../api/admin';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';

// /admin/customers
export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => setPage(1), [debounced]);

  useEffect(() => {
    let cancelled = false;
    listCustomers({ search: debounced.trim() || undefined, page, limit: 20 })
      .then((res) => !cancelled && (setData(res), setError(null)))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load customers.')));
    return () => {
      cancelled = true;
    };
  }, [debounced, page]);

  return (
    <AdminLayout title="Customers">
      <SearchBox value={search} onChange={setSearch} placeholder="Search by name, email or phone" />
      {error && <p className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}

      <div className="card mt-5 overflow-hidden">
        {!data ? (
          <div className="m-5 h-64 animate-pulse rounded-xl bg-slate-100" />
        ) : data.customers.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No customers found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="hidden px-5 py-3 sm:table-cell">Phone</th>
                    <th className="px-5 py-3 text-right">Bookings</th>
                    <th className="px-5 py-3 text-right">Total spent</th>
                    <th className="hidden px-5 py-3 md:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.customers.map((c) => (
                    <tr key={c._id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-navy">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">{c.phone}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">{c.totalBookings}</td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-navy">{formatPrice(c.totalSpent)}</td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-slate-500 md:table-cell">{shortDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} pages={data.pages} total={data.total} noun="customer" onPage={setPage} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
