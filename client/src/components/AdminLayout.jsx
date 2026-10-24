import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users & verification' },
];

export default function AdminLayout({ title, actions, children }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="flex gap-1 border-b border-slate-200" aria-label="Admin sections">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
