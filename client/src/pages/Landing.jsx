import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, IndianRupee, MapPin, Star } from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';
import { homePathFor, useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORIES } from '../data/categories';

const STEPS = [
  { Icon: MapPin, title: 'landing.step1Title', text: 'landing.step1Text' },
  { Icon: IndianRupee, title: 'landing.step2Title', text: 'landing.step2Text' },
  { Icon: Star, title: 'landing.step3Title', text: 'landing.step3Text' },
];

const TRUST = [
  { Icon: BadgeCheck, label: 'hero.trustVerified' },
  { Icon: IndianRupee, label: 'hero.trustPricing' },
  { Icon: Star, label: 'hero.trustReviews' },
];

export default function Landing() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-50 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-amber-100/60 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <p className="eyebrow">{t('hero.eyebrow')}</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] text-navy sm:text-7xl">
            {t('hero.titleStart')} <em className="text-blue-600">{t('hero.titleEm')}</em> {t('hero.titleEnd')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">{t('hero.subtitle')}</p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            {user ? (
              <Link to={homePathFor(user.role)} className="btn btn-primary btn-lg">
                {t('hero.goToDashboard')} <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  {t('hero.findWorker')} <ArrowRight size={18} />
                </Link>
                <Link to="/register?role=worker" className="btn btn-secondary btn-lg">
                  {t('hero.joinAsWorker')}
                </Link>
              </>
            )}
          </div>

          {!user && (
            <p className="mt-5 text-sm text-slate-500">
              {t('hero.alreadyAccount')}{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                {t('nav.login')}
              </Link>
            </p>
          )}

          <ul className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {TRUST.map(({ Icon, label }) => (
              <li key={label} className="caption flex items-center gap-2">
                <Icon size={16} className="text-blue-600" /> {t(label)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="eyebrow text-center">{t('landing.servicesEyebrow')}</p>
          <h2 className="mt-3 text-center font-display text-4xl text-navy sm:text-5xl">{t('landing.servicesTitle')}</h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <Link key={c.id} to={`/workers?category=${c.id}`} className="card card-hover group flex flex-col p-6">
                <CategoryIcon id={c.id} />
                <h3 className="mt-5 text-lg font-semibold text-navy">{t(`services.${c.id}`)}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{t(`services.desc.${c.id}`)}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  {t(`services.find.${c.id}`)} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="eyebrow text-center">{t('landing.howEyebrow')}</p>
        <h2 className="mt-3 text-center font-display text-4xl text-navy sm:text-5xl">{t('landing.howTitle')}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <div key={title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                  {i + 1}
                </span>
                <Icon size={20} className="text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{t(title)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{t(text)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Worker CTA */}
      {!user && (
        <section className="px-4 pb-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-navy px-8 py-10 sm:flex-row sm:items-center sm:px-12">
            <div>
              <h2 className="font-display text-3xl text-white sm:text-4xl">{t('landing.ctaTitle')}</h2>
              <p className="mt-2 max-w-lg text-slate-300">{t('landing.ctaText')}</p>
            </div>
            <Link to="/register?role=worker" className="btn btn-amber btn-lg flex-none">
              {t('hero.joinAsWorker')} <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
