import { Link } from 'react-router-dom';
import { homePathFor, useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/categories';

const STEPS = [
  { icon: '📍', title: 'Share your location', text: 'We show verified workers closest to you first.' },
  { icon: '💰', title: 'Compare clear prices', text: 'See each worker’s service prices and ratings up front.' },
  { icon: '✅', title: 'Book and review', text: 'Book a time, get the job done, then rate the work.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      <section className="bg-gradient-to-b from-blue-50 to-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Trusted local workers, <span className="text-blue-700">nearby and on demand</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Find verified plumbers, electricians, carpenters, painters and cleaners near you, with transparent
            pricing and real customer reviews.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {user ? (
              <Link to={homePathFor(user.role)} className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register?role=customer"
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Find a worker
                </Link>
                <Link
                  to="/register?role=worker"
                  className="rounded-lg border border-blue-600 bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Join as a worker
                </Link>
              </>
            )}
          </div>
          {!user && (
            <p className="mt-4 text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-xl font-bold text-slate-900">Services available</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CATEGORIES.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="text-3xl" aria-hidden="true">
                {c.icon}
              </div>
              <p className="mt-2 font-medium text-slate-800">{c.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-center text-xl font-bold text-slate-900">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-2xl" aria-hidden="true">
                {s.icon}
              </div>
              <h3 className="mt-2 font-semibold text-slate-900">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
