import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import DateTimePicker from '../components/DateTimePicker';
import LocationPicker from '../components/LocationPicker';
import { buttonStyles } from '../components/BookingCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { unitLabel } from '../components/ServicesEditor';
import { createBooking, getWorkerProfile } from '../api/bookings';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';
import { formatScheduleDate, formatTime } from '../utils/bookings';

const toLatLng = (loc) => (loc?.coordinates?.length === 2 ? { lat: loc.coordinates[1], lng: loc.coordinates[0] } : null);

// /book/:workerId — reached from "Book Now" on the worker detail page (Module 2),
// which passes the worker in router state. Falls back to fetching it.
export default function BookingForm() {
  const { workerId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [worker, setWorker] = useState(state?.worker?._id === workerId ? state.worker : null);
  const [loadError, setLoadError] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [schedule, setSchedule] = useState({ date: '', time: '' });
  const [offer, setOffer] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(toLatLng(user.location));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (worker) return;
    getWorkerProfile(workerId)
      .then(setWorker)
      .catch((err) => setLoadError(errorMessage(err, t('worker.loadError'))));
  }, [workerId, worker]);

  const service = worker?.services?.find((s) => s.name === serviceName);

  useEffect(() => {
    if (service) setOffer(String(service.price));
  }, [service]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-red-700">{loadError}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
          {t('booking.browseServices')}
        </Link>
      </div>
    );
  }
  if (!worker) return <div className="mx-auto mt-8 h-72 max-w-2xl animate-pulse rounded-2xl bg-slate-200" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!service) return setError(t('booking.errors.chooseService'));
    if (!schedule.date || !schedule.time) return setError(t('booking.errors.chooseSlot'));
    if (worker.isNegotiable && !(Number(offer) > 0)) return setError(t('booking.errors.enterOffer'));

    setError(null);
    setSubmitting(true);
    try {
      const created = await createBooking({
        workerId,
        serviceName,
        description,
        scheduledDate: schedule.date,
        scheduledTime: schedule.time,
        agreedPrice: worker.isNegotiable ? Number(offer) : undefined,
        ...(location || {}),
      });
      // Step 2: pay (or choose cash) for the new booking.
      navigate(`/payment/${created._id}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err, t('booking.errors.createFailed')));
      setSubmitting(false);
    }
  };

  const price = worker.isNegotiable ? Number(offer) || 0 : service?.price;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <button type="button" onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">
        ← {t('common.back')}
      </button>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl text-navy">{t('booking.bookWorker', { name: worker.name })}</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold text-slate-900">{t('booking.step1')}</h2>
            {worker.services?.length ? (
              <div className="mt-3 space-y-2">
                {worker.services.map((s) => (
                  <label
                    key={s._id || s.name}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                      serviceName === s.name ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="service"
                        value={s.name}
                        checked={serviceName === s.name}
                        onChange={() => setServiceName(s.name)}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <span className="text-slate-800">{s.name}</span>
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatPrice(s.price)} <span className="text-xs font-normal text-slate-400">{unitLabel(s.unit, t)}</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-slate-500">{t('worker.noServices')}</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">{t('booking.step2')}</h2>
            <DateTimePicker value={schedule} onChange={setSchedule} />
          </section>

          <section className="space-y-4 card p-5">
            <h2 className="font-semibold text-slate-900">{t('booking.step3')}</h2>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t('booking.whatNeedsDoing')}</span>
              <textarea
                rows={4}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('booking.describePlaceholder')}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <LocationPicker value={location} onChange={setLocation} />
            <p className="text-xs text-slate-400">{t('booking.locationNote')}</p>
          </section>
        </div>

        {/* Summary */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900">{t('booking.summary')}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label={t('payment.worker')} value={worker.name} />
              <Row label={t('payment.service')} value={service?.name || '—'} />
              <Row
                label={t('payment.when')}
                value={schedule.date && schedule.time ? `${formatScheduleDate(schedule.date)}, ${formatTime(schedule.time)}` : '—'}
              />
            </dl>

            {worker.isNegotiable && service ? (
              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">{t('booking.yourOffer')}</span>
                <input
                  type="number"
                  min="1"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <span className="mt-1 block text-xs text-emerald-700">
                  {t('booking.offerNote', { price: formatPrice(service.price) })}
                </span>
              </label>
            ) : (
              <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-500">{t('booking.price')}</span>
                <span className="text-2xl font-bold text-slate-900">{service ? formatPrice(price) : '—'}</span>
              </div>
            )}

            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={submitting} className="btn btn-amber mt-4 w-full py-3">
              {submitting ? t('booking.sending') : t('booking.continueToPayment')}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">{t('booking.payDirectNote')}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
