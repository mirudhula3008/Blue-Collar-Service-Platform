import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/workers', label: 'Workers' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/users', label: 'Verification' },
];

export default function AdminLayout({ title, actions, children }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4" aria-label="Admin sections">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
                isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl sm:text-4xl text-navy">{title}</h1>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
