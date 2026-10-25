import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Wrench, X } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { homePathFor, useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Links per role (labels are translation keys).
const LINKS = {
  customer: [
    { to: '/dashboard', label: 'nav.services' },
    { to: '/bookings', label: 'nav.myBookings' },
    { to: '/profile', label: 'nav.profile' },
  ],
  worker: [
    { to: '/worker/dashboard', label: 'nav.requests' },
    { to: '/worker/jobs', label: 'nav.jobs' },
    { to: '/worker/earnings', label: 'nav.earnings' },
    { to: '/worker/reviews', label: 'nav.reviews' },
    { to: '/profile', label: 'nav.profile' },
  ],
  admin: [
    { to: '/admin', label: 'nav.overview', end: true },
    { to: '/admin/workers', label: 'nav.workers' },
    { to: '/admin/bookings', label: 'nav.bookings' },
  ],
};
const GUEST_LINKS = [{ to: '/dashboard', label: 'nav.findWorkers' }];

const linkClass = ({ isActive }) =>
  `block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-navy'
  }`;

export default function Navbar() {
  const { user, logout, rememberLanguage } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  const links = user ? LINKS[user.role] || [] : GUEST_LINKS;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link
          to={user ? homePathFor(user.role) : '/'}
          className="group flex items-center gap-2 text-2xl font-extrabold tracking-tight"
          onClick={close}
          aria-label={t('app.name')}
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition group-hover:-rotate-12">
            <Wrench size={20} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span>
            <span className="text-navy">{t('app.nameFirst')}</span>
            <span className="text-blue-600">{t('app.nameSecond')}</span>
          </span>
        </Link>

        {/* Always-visible controls on small screens */}
        <div className="flex items-center gap-1 lg:hidden">
          <LanguageSelector onChange={rememberLanguage} />
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-50"
            onClick={() => setOpen((o) => !o)}
            aria-label={t('nav.toggleMenu')}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-16 flex-col gap-1 border-b border-slate-200 bg-white p-3 shadow-lift lg:static lg:flex lg:flex-row lg:items-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={close}>
              {t(l.label)}
            </NavLink>
          ))}

          <div className="hidden lg:ml-2 lg:block">
            <LanguageSelector onChange={rememberLanguage} />
          </div>

          {user ? (
            <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-3 lg:ml-2 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm leading-tight">
                <span className="block font-semibold text-navy">{user.name.split(' ')[0]}</span>
                <span className="block text-xs text-slate-500">{t(`nav.roles.${user.role}`)}</span>
              </span>
              <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm ml-auto lg:ml-1" title={t('nav.logout')}>
                <LogOut size={16} /> <span className="lg:hidden xl:inline">{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-3 lg:ml-1 lg:mt-0 lg:border-0 lg:pt-0">
              <Link to="/login" onClick={close} className="btn btn-ghost btn-sm">
                {t('nav.login')}
              </Link>
              <Link to="/register" onClick={close} className="btn btn-primary btn-sm">
                {t('nav.signup')}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
