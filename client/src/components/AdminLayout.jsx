import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const TABS = [
  { to: '/admin', label: 'nav.overview', end: true },
  { to: '/admin/workers', label: 'nav.workers' },
  { to: '/admin/customers', label: 'admin.customers' },
  { to: '/admin/bookings', label: 'nav.bookings' },
  { to: '/admin/users', label: 'admin.verification' },
];

export default function AdminLayout({ title, actions, children }) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4" aria-label={t('nav.admin')}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
                isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {t(tab.label)}
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
