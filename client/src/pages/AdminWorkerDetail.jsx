import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, History, Link2, Mail, MapPin, Paperclip, Phone, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import { ACCOUNT_STATUS, AccountStatusBadge, dateTime, shortDate } from '../components/AdminUi';
import { getWorkerAdminProfile, setWorkerStatus, uploadEvidence } from '../api/admin';
import { errorMessage } from '../api/client';
import { formatPrice } from '../utils/format';

const MIN_REASON = 10;
const RESTRICTIVE = ['suspended', 'blocked'];

// /admin/workers/:id — full profile, account status control and the audit trail.
export default function AdminWorkerDetail() {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    getWorkerAdminProfile(id)
      .then((w) => {
        setWorker(w);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err, 'Could not load this worker.')));
  }, [id]);

  useEffect(load, [load]);

  const back = (
    <Link to="/admin/workers" className="btn btn-ghost btn-sm">
      <ArrowLeft size={16} /> All workers
    </Link>
  );

  if (error) {
    return (
      <AdminLayout title="Worker" actions={back}>
        <p className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>
      </AdminLayout>
    );
  }
  if (!worker) {
    return (
      <AdminLayout title="Worker" actions={back}>
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </AdminLayout>
    );
  }

  const { stats } = worker;

  return (
    <AdminLayout title={worker.name} actions={back}>
      {notice && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          <span className="flex gap-2">
            <Check size={18} className="flex-none" /> {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {/* Profile */}
          <section className="card flex flex-col gap-5 p-6 sm:flex-row">
            {worker.profilePhoto ? (
              <img src={worker.profilePhoto} alt="" className="h-20 w-20 flex-none rounded-full bg-slate-100 object-cover" />
            ) : (
              <span className="flex h-20 w-20 flex-none items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-3xl font-semibold text-white">
                {worker.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <AccountStatusBadge status={worker.accountStatus} />
                <span className={`badge ${worker.isVerified ? 'badge-verified' : 'badge-negotiable'}`}>
                  {worker.isVerified ? 'ID verified' : 'ID not verified'}
                </span>
                <span className="badge badge-outline capitalize">{worker.serviceCategory}</span>
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-slate-600 sm:grid-cols-2">
                <Info Icon={Mail} value={worker.email} />
                <Info Icon={Phone} value={worker.phone} />
                <Info Icon={MapPin} value={worker.address || 'No address'} />
                <Info Icon={History} value={`Joined ${shortDate(worker.createdAt)}`} />
              </dl>
              {worker.idProofUrl && (
                <a href={worker.idProofUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-medium text-blue-600 hover:underline">
                  View ID proof ↗
                </a>
              )}
            </div>
          </section>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Completed jobs" value={stats.completedJobs} />
            <Stat label="Cancelled" value={stats.cancelledJobs} />
            <Stat label="Rating" value={stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : '—'} sub={`${stats.totalReviews} reviews`} />
            <Stat label="Earnings" value={formatPrice(stats.totalEarnings)} sub={`${formatPrice(stats.commissionPaid)} commission`} />
          </div>

          {/* Audit trail */}
          <section className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl text-navy">Status history</h2>
              <p className="text-xs text-slate-400">Append-only. Entries can’t be edited or deleted.</p>
            </div>
            {worker.statusHistory.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No status changes yet. This worker has been active since joining.</p>
            ) : (
              <ol className="mt-5 space-y-5 border-l-2 border-slate-100 pl-5">
                {worker.statusHistory.map((h) => (
                  <li key={h._id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600 ring-2 ring-slate-100" />
                    <div className="flex flex-wrap items-center gap-2">
                      <AccountStatusBadge status={h.status} />
                      <span className="text-xs text-slate-400">
                        {dateTime(h.changedAt)} · by {h.changedBy?.name || 'Admin'}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-sm text-slate-700">{h.reason}</p>
                    {h.evidence?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {h.evidence.map((url, i) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:border-blue-400"
                          >
                            <Paperclip size={12} /> Evidence {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Recent bookings */}
          <section className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-4 font-display text-2xl text-navy">Recent bookings</h2>
            {worker.recentBookings.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {worker.recentBookings.map((b) => (
                  <li key={b._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-navy">{b.serviceName}</p>
                      <p className="text-xs text-slate-500">
                        {b.customerId?.name || 'Customer'} · {shortDate(b.scheduledDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-slate-700">{formatPrice(b.agreedPrice)}</span>
                      <StatusBadge status={b.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent reviews */}
          <section className="card p-6">
            <h2 className="font-display text-2xl text-navy">Recent reviews</h2>
            {worker.recentReviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No reviews yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {worker.recentReviews.map((r) => (
                  <li key={r._id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-navy">{r.customerId?.name || 'Customer'}</span>
                      <span className="text-amber-500" aria-label={`${r.rating} out of 5`}>
                        {'★'.repeat(r.rating)}
                        <span className="text-slate-200">{'★'.repeat(5 - r.rating)}</span>
                      </span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                    <p className="mt-1 text-xs text-slate-400">{shortDate(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Status control */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <StatusChanger
            worker={worker}
            onChanged={(result) => {
              const parts = [`Status changed to ${ACCOUNT_STATUS[result.worker.accountStatus].label.toLowerCase()}.`];
              if (result.cancelledBookings) parts.push(`${result.cancelledBookings} booking(s) cancelled.`);
              if (result.refundedPayments) parts.push(`${result.refundedPayments} payment(s) refunded.`);
              setNotice(parts.join(' '));
              load();
            }}
          />
        </aside>
      </div>
    </AdminLayout>
  );
}

function StatusChanger({ worker, onChanged }) {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const options = Object.keys(ACCOUNT_STATUS).filter((s) => s !== worker.accountStatus);
  const trimmed = reason.trim();
  const valid = status && trimmed.length >= MIN_REASON;
  const pendingToCancel = worker.recentBookings.filter((b) => ['requested', 'accepted'].includes(b.status)).length;

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) return setError('Evidence links must start with http:// or https://');
    if (!evidence.includes(url)) setEvidence([...evidence, url]);
    setLink('');
    setError(null);
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadEvidence(file);
      setEvidence((list) => [...list, url]);
    } catch (err) {
      setError(errorMessage(err, 'Could not upload that file.'));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    if (RESTRICTIVE.includes(status)) {
      const msg = `${ACCOUNT_STATUS[status].label.replace(/ed$/, '')} ${worker.name}? Their pending and accepted bookings will be cancelled and any payments refunded.`;
      if (!window.confirm(msg)) return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await setWorkerStatus(worker._id, { status, reason: trimmed, evidence });
      setStatus('');
      setReason('');
      setEvidence([]);
      onChanged(result);
    } catch (err) {
      setError(errorMessage(err, 'Could not change the status.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-6">
      <h2 className="font-display text-2xl text-navy">Change account status</h2>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        Currently <AccountStatusBadge status={worker.accountStatus} />
      </p>

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-semibold text-navy">New status</legend>
        {options.map((s) => {
          const meta = ACCOUNT_STATUS[s];
          const selected = status === s;
          return (
            <label
              key={s}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                selected ? 'border-blue-600 bg-blue-50 shadow-glow' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <input type="radio" name="status" value={s} checked={selected} onChange={() => setStatus(s)} className="mt-1 h-4 w-4 accent-blue-600" />
              <span>
                <span className="block text-sm font-semibold text-navy">{meta.label}</span>
                <span className="block text-xs text-slate-500">{meta.help}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-navy">
          Reason <span className="text-rose-500">*</span>
        </span>
        <textarea
          rows={4}
          maxLength={2000}
          className="input mt-1"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What happened, which booking, what was tried. This is shown in the audit log and used for appeals."
        />
        <span className={`mt-1 block text-xs ${trimmed.length >= MIN_REASON ? 'text-emerald-600' : 'text-slate-400'}`}>
          {trimmed.length < MIN_REASON ? `${MIN_REASON - trimmed.length} more characters needed` : `${trimmed.length} characters ✓`}
        </span>
      </label>

      <div className="mt-4">
        <span className="text-sm font-semibold text-navy">Evidence (optional)</span>
        <div className="mt-1 flex gap-2">
          <input
            className="input"
            placeholder="https://…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
          />
          <button type="button" className="btn btn-secondary btn-sm flex-none" onClick={addLink} disabled={!link.trim()} title="Add link">
            <Link2 size={16} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm flex-none"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Upload photo or screenshot"
          >
            {uploading ? '…' : <Paperclip size={16} />}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        </div>
        {evidence.length > 0 && (
          <ul className="mt-2 space-y-1">
            {evidence.map((url, i) => (
              <li key={url} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
                <a href={url} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline">
                  Evidence {i + 1}: {url.replace(/^https?:\/\//, '')}
                </a>
                <button type="button" onClick={() => setEvidence(evidence.filter((u) => u !== url))} aria-label="Remove evidence">
                  <X size={14} className="text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {RESTRICTIVE.includes(status) && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          {pendingToCancel > 0
            ? `${pendingToCancel} pending or accepted booking(s) will be cancelled and refunded.`
            : 'Any pending or accepted bookings will be cancelled and refunded.'}
        </p>
      )}

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={!valid || saving}
        className={`btn mt-5 w-full py-3 ${RESTRICTIVE.includes(status) ? 'bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary'}`}
      >
        {saving ? 'Saving…' : status ? `Set to ${ACCOUNT_STATUS[status].label.toLowerCase()}` : 'Choose a new status'}
      </button>
    </form>
  );
}

function Info({ Icon, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon size={14} className="flex-none text-slate-400" aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-navy">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
