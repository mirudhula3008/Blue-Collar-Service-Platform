import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, IndianRupee, MapPin, Star } from 'lucide-react';
import CategoryIcon, { CATEGORY_META } from '../components/CategoryIcon';
import { homePathFor, useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/categories';

const PLURAL = {
  plumbing: 'plumbers',
  electrical: 'electricians',
  carpentry: 'carpenters',
  painting: 'painters',
  cleaning: 'cleaners',
};

const STEPS = [
  { Icon: MapPin, title: 'Share your location', text: 'We show verified workers closest to you first, on a map and in a list.' },
  { Icon: IndianRupee, title: 'Compare clear prices', text: 'Every worker lists their service prices up front. Many are negotiable.' },
  { Icon: Star, title: 'Book and review', text: 'Pick a time slot, get the job done, then rate the work for others.' },
];

const TRUST = [
  { Icon: BadgeCheck, label: 'ID-verified workers' },
  { Icon: IndianRupee, label: 'Transparent pricing' },
  { Icon: Star, label: 'Real customer reviews' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-50 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-amber-100/60 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <p className="eyebrow">Hyperlocal · On-demand · Verified</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] text-navy sm:text-7xl">
            Skilled hands, <em className="text-blue-600">trusted</em> work.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
            Connect with verified plumbers, electricians, carpenters, painters and cleaners in your area. Transparent
            pricing, real reviews, negotiable rates.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            {user ? (
              <Link to={homePathFor(user.role)} className="btn btn-primary btn-lg">
                Go to your dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Find a worker <ArrowRight size={18} />
                </Link>
                <Link to="/register?role=worker" className="btn btn-secondary btn-lg">
                  Join as worker
                </Link>
              </>
            )}
          </div>

          {!user && (
            <p className="mt-5 text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          )}

          <ul className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {TRUST.map(({ Icon, label }) => (
              <li key={label} className="caption flex items-center gap-2">
                <Icon size={16} className="text-blue-600" /> {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="eyebrow text-center">Services available</p>
          <h2 className="mt-3 text-center font-display text-4xl text-navy sm:text-5xl">Find workers near you</h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <Link key={c.id} to={`/workers?category=${c.id}`} className="card card-hover group flex flex-col p-6">
                <CategoryIcon id={c.id} />
                <h3 className="mt-5 text-lg font-semibold text-navy">{c.name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{CATEGORY_META[c.id]?.blurb}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  Find {PLURAL[c.id]} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="eyebrow text-center">How it works</p>
        <h2 className="mt-3 text-center font-display text-4xl text-navy sm:text-5xl">Three steps to a job well done</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <div key={title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                  {i + 1}
                </span>
                <Icon size={20} className="text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Worker CTA */}
      {!user && (
        <section className="px-4 pb-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-navy px-8 py-10 sm:flex-row sm:items-center sm:px-12">
            <div>
              <h2 className="font-display text-3xl text-white sm:text-4xl">Are you a skilled worker?</h2>
              <p className="mt-2 max-w-lg text-slate-300">
                Set your own prices, choose when you’re available, and get bookings from customers nearby.
              </p>
            </div>
            <Link to="/register?role=worker" className="btn btn-amber btn-lg flex-none">
              Join as worker <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
