import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Banknote, Check, CreditCard, Loader2, Lock, Smartphone, Wallet, X } from 'lucide-react';
import { getBooking } from '../api/bookings';
import { createPayment, getPaymentForBooking, processPayment } from '../api/payments';
import { errorMessage } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/format';
import { CLOSED, formatScheduleDate, formatTime } from '../utils/bookings';

const METHODS = [
  { id: 'upi', label: 'payment.upi', hint: 'payment.upiHint', Icon: Smartphone },
  { id: 'card', label: 'payment.card', hint: 'payment.cardHint', Icon: CreditCard },
  { id: 'wallet', label: 'payment.wallet', hint: 'payment.walletHint', Icon: Wallet },
  { id: 'cash', label: 'payment.cash', hint: 'payment.cashHint', Icon: Banknote },
];
// App names are brands and stay untranslated.
const UPI_APPS = [
  { id: 'gpay', label: 'Google Pay' },
  { id: 'phonepe', label: 'PhonePe' },
  { id: 'paytm', label: 'Paytm' },
];
const WALLETS = ['paytm', 'amazonpay', 'phonepe'];

const formatCardNumber = (v) =>
  v
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (v) => {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

export function paymentMethodText(payment, t) {
  if (!payment) return '';
  const d = payment.methodDetails || {};
  if (payment.method === 'upi') return `UPI · ${d.upiId}`;
  if (payment.method === 'card') return t('payment.cardEnding', { brand: d.brand || 'Card', last4: d.last4 });
  if (payment.method === 'wallet') return t(`payment.wallets.${d.wallet}`);
  return t('payment.cashAfter');
}

// /payment/:bookingId — simulated checkout. No real money moves.
export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [booking, setBooking] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [method, setMethod] = useState('upi');
  const [upi, setUpi] = useState({ app: 'gpay', upiId: '' });
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [wallet, setWallet] = useState('paytm');
  const [phase, setPhase] = useState('form'); // form | processing | success | failed
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBooking(bookingId)
      .then(async (b) => {
        setBooking(b);
        if (b.paymentStatus === 'paid') {
          const payment = await getPaymentForBooking(bookingId);
          setResult(payment);
          setPhase('success');
        }
      })
      .catch((err) => setLoadError(errorMessage(err, t('payment.loadError'))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const validate = () => {
    if (method === 'upi' && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi.upiId.trim())) return t('payment.errors.upi');
    if (method === 'card') {
      if (card.cardNumber.replace(/\s/g, '').length < 13) return t('payment.errors.cardNumber');
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return t('payment.errors.expiry');
      if (!/^\d{3,4}$/.test(card.cvv)) return t('payment.errors.cvv');
    }
    return null;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    const methodDetails =
      method === 'upi'
        ? { upiId: upi.upiId.trim(), app: upi.app }
        : method === 'card'
          ? { cardNumber: card.cardNumber, expiry: card.expiry, cvv: card.cvv }
          : method === 'wallet'
            ? { wallet }
            : {};

    setError(null);
    setPhase('processing');
    try {
      const payment = await createPayment({ bookingId, method, methodDetails });
      const completed = await processPayment(payment._id);
      setResult(completed);
      setPhase('success');
    } catch (err) {
      setResult(err.response?.data?.payment || null);
      setError(errorMessage(err, t('payment.payFailed')));
      setPhase(err.response?.status === 402 ? 'failed' : 'form');
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-rose-700">{loadError}</p>
        <Link to="/bookings" className="btn btn-secondary mt-6">
          {t('payment.backToBookings')}
        </Link>
      </div>
    );
  }
  if (!booking) return <div className="mx-auto mt-10 h-80 max-w-4xl animate-pulse rounded-2xl bg-slate-100" />;

  const amount = booking.agreedPrice;
  const workerName = booking.workerId?.name || t('payment.theWorker');

  if (phase === 'success') return <SuccessScreen payment={result} booking={booking} onDone={() => navigate('/bookings')} />;

  if (CLOSED.includes(booking.status)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-navy">{t('payment.cantPay')}</h1>
        <p className="mt-2 text-slate-500">{t('payment.cantPayReason', { status: t(`booking.status.${booking.status}`) })}</p>
        <Link to="/bookings" className="btn btn-secondary mt-6">
          {t('payment.backToBookings')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="eyebrow">{t('payment.eyebrow')}</p>
      <h1 className="mt-2 font-display text-3xl text-navy sm:text-4xl">{t('payment.heading')}</h1>
      <p className="mt-1 text-slate-500">{t('payment.intro', { worker: workerName })}</p>

      <form onSubmit={handlePay} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {/* Method picker */}
          <fieldset className="card p-5">
            <legend className="sr-only">{t('payment.selectMethod')}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {METHODS.map(({ id, label, hint, Icon }) => {
                const selected = method === id;
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                      selected ? 'border-blue-600 bg-blue-50 shadow-glow' : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={id}
                      checked={selected}
                      onChange={() => {
                        setMethod(id);
                        setError(null);
                      }}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${
                        selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-navy">{t(label)}</span>
                      <span className="block truncate text-xs text-slate-500">{t(hint)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Method details */}
          <div className="card p-6">
            {method === 'upi' && (
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-semibold text-navy">{t('payment.payUsing')}</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {UPI_APPS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setUpi({ ...upi, app: a.id })}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                          upi.app === a.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-navy">{t('payment.upiId')}</span>
                  <input
                    className="input mt-1"
                    placeholder="yourname@okaxis"
                    value={upi.upiId}
                    onChange={(e) => setUpi({ ...upi, upiId: e.target.value })}
                    autoComplete="off"
                    autoCapitalize="none"
                  />
                </label>
              </div>
            )}

            {method === 'card' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-navy">{t('payment.cardNumber')}</span>
                  <input
                    className="input mt-1 tracking-wider"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={card.cardNumber}
                    onChange={(e) => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-navy">{t('payment.expiry')}</span>
                  <input
                    className="input mt-1"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-navy">{t('payment.cvv')}</span>
                  <input
                    className="input mt-1"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="•••"
                    maxLength={4}
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                  />
                </label>
                <p className="text-xs text-slate-400 sm:col-span-2">{t('payment.testCard')}</p>
              </div>
            )}

            {method === 'wallet' && (
              <label className="block">
                <span className="text-sm font-semibold text-navy">{t('payment.chooseWallet')}</span>
                <select className="input mt-1" value={wallet} onChange={(e) => setWallet(e.target.value)}>
                  {WALLETS.map((w) => (
                    <option key={w} value={w}>
                      {t(`payment.wallets.${w}`)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {method === 'cash' && (
              <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                <Banknote size={20} className="flex-none" />
                <p>{t('payment.cashNote', { amount: formatPrice(amount), worker: workerName })}</p>
              </div>
            )}
          </div>

          {error && phase === 'form' && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        </div>

        {/* Order summary */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-semibold text-navy">{t('payment.orderSummary')}</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label={t('payment.worker')} value={workerName} />
              <Row label={t('payment.service')} value={booking.serviceName} />
              <Row label={t('payment.when')} value={`${formatScheduleDate(booking.scheduledDate)}, ${formatTime(booking.scheduledTime)}`} />
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">{t('payment.total')}</span>
              <span className="text-3xl font-bold text-navy">{formatPrice(amount)}</span>
            </div>
            <button type="submit" disabled={phase !== 'form'} className="btn btn-primary mt-5 w-full py-3 text-base">
              {method === 'cash' ? t('payment.confirmCash') : t('payment.payAmount', { amount: formatPrice(amount) })}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Lock size={12} /> {t('payment.demoNote')}
            </p>
          </div>
          <Link to="/bookings" className="block text-center text-sm font-medium text-slate-500 hover:text-navy">
            {t('payment.payLater')}
          </Link>
        </aside>
      </form>

      {phase === 'processing' && (
        <Overlay>
          <Loader2 size={48} className="animate-spin text-blue-600" />
          <p className="mt-4 text-lg font-semibold text-navy">{t('payment.processing')}</p>
          <p className="mt-1 text-sm text-slate-500">{t('payment.dontClose')}</p>
        </Overlay>
      )}

      {phase === 'failed' && (
        <Overlay>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <X size={32} strokeWidth={2.5} />
          </span>
          <p className="mt-4 text-xl font-semibold text-navy">{t('payment.failed')}</p>
          <p className="mt-1 max-w-xs text-sm text-slate-500">{error}</p>
          {result?.transactionId && <p className="mt-2 font-mono text-xs text-slate-400">{result.transactionId}</p>}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPhase('form');
                setError(null);
              }}
            >
              {t('payment.tryAgain')}
            </button>
            <Link to="/bookings" className="btn btn-secondary">
              {t('payment.payLaterShort')}
            </Link>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function SuccessScreen({ payment, booking, onDone }) {
  const { t } = useLanguage();
  const worker = booking.workerId?.name || t('payment.theWorker');
  const cash = payment?.method === 'cash';
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="card p-8 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Check size={40} strokeWidth={3} />
        </span>
        <h1 className="mt-5 font-display text-4xl text-navy">{cash ? t('payment.cashConfirmed') : t('payment.success')}</h1>
        <p className="mt-2 text-slate-500">{cash ? t('payment.successNoteCash', { worker }) : t('payment.successNote', { worker })}</p>

        <dl className="mt-8 space-y-3 rounded-xl bg-slate-50 p-5 text-left text-sm">
          <Row label={t('payment.amount')} value={formatPrice(payment?.amount ?? booking.agreedPrice)} strong />
          <Row label={t('payment.method')} value={paymentMethodText(payment, t)} />
          <Row label={t('payment.transactionId')} value={<span className="font-mono">{payment?.transactionId}</span>} />
          <Row label={t('payment.service')} value={booking.serviceName} />
          {payment?.completedAt && <Row label={t('payment.paidOn')} value={new Date(payment.completedAt).toLocaleString('en-IN')} />}
        </dl>

        <button type="button" onClick={onDone} className="btn btn-primary mt-8 w-full py-3">
          {t('payment.viewBooking')}
        </button>
      </div>
    </div>
  );
}

function Overlay({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-8 text-center shadow-lift">{children}</div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right ${strong ? 'text-lg font-bold text-navy' : 'font-medium text-slate-800'}`}>{value}</dd>
    </div>
  );
}
