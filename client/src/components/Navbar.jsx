import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { homePathFor, useAuth } from '../context/AuthContext';

// Links per role. Other modules add their pages here when merging.
const LINKS = {
  customer: [
    { to: '/dashboard', label: 'Services' },
    { to: '/bookings', label: 'My bookings' },
    { to: '/profile', label: 'Profile' },
  ],
  worker: [
    { to: '/worker/dashboard', label: 'Requests' },
    { to: '/worker/jobs', label: 'Jobs' },
    { to: '/profile', label: 'Profile' },
  ],
  admin: [{ to: '/admin', label: 'Admin' }],
};

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'text-blue-700' : 'text-slate-600 hover:text-blue-700'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const links = user ? LINKS[user.role] || [] : [];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to={user ? homePathFor(user.role) : '/'} className="text-lg font-bold text-blue-700">
          Blue-Collar <span className="text-slate-800">Services</span>
        </Link>

        <button
          type="button"
          className="rounded-md p-2 text-slate-600 sm:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          ☰
        </button>

        <nav
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-14 flex-col gap-1 border-b border-slate-200 bg-white p-3 sm:static sm:flex sm:flex-row sm:items-center sm:border-0 sm:p-0`}
        >
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <span className="px-3 py-2 text-sm text-slate-400 sm:border-l sm:border-slate-200">
                {user.name.split(' ')[0]} · <span className="capitalize">{user.role}</span>
              </span>
              <button type="button" onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                Log in
              </NavLink>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
