import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { homePathFor, useAuth } from '../context/AuthContext';

// Links per role.
const LINKS = {
  customer: [
    { to: '/dashboard', label: 'Services' },
    { to: '/bookings', label: 'My bookings' },
    { to: '/profile', label: 'Profile' },
  ],
  worker: [
    { to: '/worker/dashboard', label: 'Requests' },
    { to: '/worker/jobs', label: 'Jobs' },
    { to: '/worker/reviews', label: 'Reviews' },
    { to: '/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/users', label: 'Users' },
  ],
};

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-navy'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  const links = user ? LINKS[user.role] || [] : [{ to: '/dashboard', label: 'Find workers' }];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to={user ? homePathFor(user.role) : '/'} className="text-xl font-bold tracking-tight" onClick={close}>
          <span className="text-blue-600">Blue-Collar</span> <span className="text-navy">Services</span>
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 sm:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-16 flex-col gap-1 border-b border-slate-200 bg-white p-3 shadow-lift sm:static sm:flex sm:flex-row sm:items-center sm:gap-1 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}
        >
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={close}>
              {l.label}
            </NavLink>
          ))}

          {user ? (
            <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-3 sm:ml-3 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm leading-tight">
                <span className="block font-semibold text-navy">{user.name.split(' ')[0]}</span>
                <span className="block text-xs capitalize text-slate-500">{user.role}</span>
              </span>
              <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm ml-auto sm:ml-1" title="Log out">
                <LogOut size={16} /> <span className="sm:hidden lg:inline">Log out</span>
              </button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-3 sm:ml-3 sm:mt-0 sm:border-0 sm:pt-0">
              <Link to="/login" onClick={close} className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" onClick={close} className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
