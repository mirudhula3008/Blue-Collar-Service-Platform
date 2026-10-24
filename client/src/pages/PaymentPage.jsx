import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Banknote, Check, CreditCard, Loader2, Lock, Smartphone, Wallet, X } from 'lucide-react';
import { getBooking } from '../api/bookings';
import { createPayment, getPaymentForBooking, processPayment } from '../api/payments';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';
import { CLOSED, formatScheduleDate, formatTime } from '../utils/bookings';

const METHODS = [
  { id: 'upi', label: 'UPI', hint: 'Google Pay, PhonePe, Paytm', Icon: Smartphone },
  { id: 'card', label: 'Credit / Debit card', hint: 'Visa, Mastercard, RuPay', Icon: CreditCard },
  { id: 'wallet', label: 'Wallet', hint: 'Paytm, Amazon Pay, PhonePe', Icon: Wallet },
  { id: 'cash', label: 'Cash', hint: 'Pay the worker after the job', Icon: Banknote },
];
const UPI_APPS = [
  { id: 'gpay', label: 'Google Pay' },
  { id: 'phonepe', label: 'PhonePe' },
  { id: 'paytm', label: 'Paytm' },
];
const WALLETS = [
  { id: 'paytm', label: 'Paytm Wallet' },
  { id: 'amazonpay', label: 'Amazon Pay' },
  { id: 'phonepe', label: 'PhonePe Wallet' },
];

const formatCardNumber = (v) =>
  v
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (v) => {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

export function paymentMethodText(payment) {
  if (!payment) return '';
  const d = payment.methodDetails || {};
  if (payment.method === 'upi') return `UPI · ${d.upiId}`;
  if (payment.method === 'card') return `${d.brand || 'Card'} ending ${d.last4}`;
  if (payment.method === 'wallet') return WALLETS.find((w) => w.id === d.wallet)?.label || 'Wallet';
  return 'Cash after the job';
}

// /payment/:bookingId — simulated checkout. No real money moves.
export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

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
      .catch((err) => setLoadError(errorMessage(err, 'Could not load this booking.')));
  }, [bookingId]);

  const validate = () => {
    if (method === 'upi' && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi.upiId.trim())) return 'Enter a valid UPI ID, e.g. name@okaxis';
    if (method === 'card') {
      if (card.cardNumber.replace(/\s/g, '').length < 13) return 'Enter your full card number';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return 'Expiry must be MM/YY';
      if (!/^\d{3,4}$/.test(card.cvv)) return 'Enter the 3 or 4 digit CVV';
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
      setError(errorMessage(err, 'Payment could not be completed.'));
      setPhase(err.response?.status === 402 ? 'failed' : 'form');
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-rose-700">{loadError}</p>
        <Link to="/bookings" className="btn btn-secondary mt-6">
          Back to my bookings
        </Link>
      </div>
    );
  }
  if (!booking) return <div className="mx-auto mt-10 h-80 max-w-4xl animate-pulse rounded-2xl bg-slate-100" />;

  const amount = booking.agreedPrice;
  const workerName = booking.workerId?.name || 'the worker';

  if (phase === 'success') return <SuccessScreen payment={result} booking={booking} onDone={() => navigate('/bookings')} />;

  if (CLOSED.includes(booking.status)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-navy">This booking can’t be paid</h1>
        <p className="mt-2 text-slate-500">It was {booking.status.replace(/_/g, ' ')}.</p>
        <Link to="/bookings" className="btn btn-secondary mt-6">
          Back to my bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="eyebrow">Step 2 of 2 · Payment</p>
      <h1 className="mt-2 font-display text-3xl text-navy sm:text-4xl">Pay for your booking</h1>
      <p className="mt-1 text-slate-500">
        Your request has been sent to {workerName}. Pay now to secure the slot, or choose cash to pay after the job.
      </p>

      <form onSubmit={handlePay} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {/* Method picker */}
          <fieldset className="card p-5">
            <legend className="sr-only">Payment method</legend>
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
                      <span className="block font-semibold text-navy">{label}</span>
                      <span className="block truncate text-xs text-slate-500">{hint}</span>
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
                  <span className="text-sm font-semibold text-navy">Pay using</span>
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
                  <span className="text-sm font-semibold text-navy">UPI ID</span>
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
                  <span className="text-sm font-semibold text-navy">Card number</span>
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
                  <span className="text-sm font-semibold text-navy">Expiry</span>
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
                  <span className="text-sm font-semibold text-navy">CVV</span>
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
                <p className="text-xs text-slate-400 sm:col-span-2">
                  Demo: any valid-looking card succeeds. Test card <span className="font-mono">4000 0000 0000 0002</span> is always
                  declined.
                </p>
              </div>
            )}

            {method === 'wallet' && (
              <label className="block">
                <span className="text-sm font-semibold text-navy">Choose wallet</span>
                <select className="input mt-1" value={wallet} onChange={(e) => setWallet(e.target.value)}>
                  {WALLETS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {method === 'cash' && (
              <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                <Banknote size={20} className="flex-none" />
                <p>
                  You’ll pay <strong>{formatPrice(amount)}</strong> in cash to {workerName} once the job is done. We’ll record
                  the booking as cash-on-delivery.
                </p>
              </div>
            )}
          </div>

          {error && phase === 'form' && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        </div>

        {/* Order summary */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-semibold text-navy">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Worker" value={workerName} />
              <Row label="Service" value={booking.serviceName} />
              <Row label="When" value={`${formatScheduleDate(booking.scheduledDate)}, ${formatTime(booking.scheduledTime)}`} />
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-3xl font-bold text-navy">{formatPrice(amount)}</span>
            </div>
            <button type="submit" disabled={phase !== 'form'} className="btn btn-primary mt-5 w-full py-3 text-base">
              {method === 'cash' ? 'Confirm cash payment' : `Pay ${formatPrice(amount)}`}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Lock size={12} /> Demo checkout. No real money is charged.
            </p>
          </div>
          <Link to="/bookings" className="block text-center text-sm font-medium text-slate-500 hover:text-navy">
            Pay later from My bookings
          </Link>
        </aside>
      </form>

      {phase === 'processing' && (
        <Overlay>
          <Loader2 size={48} className="animate-spin text-blue-600" />
          <p className="mt-4 text-lg font-semibold text-navy">Processing payment…</p>
          <p className="mt-1 text-sm text-slate-500">Please don’t close this page.</p>
        </Overlay>
      )}

      {phase === 'failed' && (
        <Overlay>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <X size={32} strokeWidth={2.5} />
          </span>
          <p className="mt-4 text-xl font-semibold text-navy">Payment failed</p>
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
              Try again
            </button>
            <Link to="/bookings" className="btn btn-secondary">
              Pay later
            </Link>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function SuccessScreen({ payment, booking, onDone }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="card p-8 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Check size={40} strokeWidth={3} />
        </span>
        <h1 className="mt-5 font-display text-4xl text-navy">{payment?.method === 'cash' ? 'Booking confirmed' : 'Payment successful'}</h1>
        <p className="mt-2 text-slate-500">
          {payment?.method === 'cash'
            ? `Pay ${booking.workerId?.name || 'the worker'} in cash after the job.`
            : `${booking.workerId?.name || 'The worker'} will confirm your booking shortly.`}
        </p>

        <dl className="mt-8 space-y-3 rounded-xl bg-slate-50 p-5 text-left text-sm">
          <Row label="Amount" value={formatPrice(payment?.amount ?? booking.agreedPrice)} strong />
          <Row label="Method" value={paymentMethodText(payment)} />
          <Row label="Transaction ID" value={<span className="font-mono">{payment?.transactionId}</span>} />
          <Row label="Service" value={booking.serviceName} />
          {payment?.completedAt && <Row label="Paid on" value={new Date(payment.completedAt).toLocaleString('en-IN')} />}
        </dl>

        <button type="button" onClick={onDone} className="btn btn-primary mt-8 w-full py-3">
          View booking
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
