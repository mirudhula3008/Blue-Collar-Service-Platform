import { useRef, useState } from 'react';
import FormField from '../components/FormField';
import LocationPicker from '../components/LocationPicker';
import ServicesEditor, { cleanServices } from '../components/ServicesEditor';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadIdProof, uploadProfilePhoto } from '../api/auth';
import { errorMessage } from '../api/client';
import { CATEGORIES } from '../data/categories';

const toLatLng = (location) =>
  location?.coordinates?.length === 2 ? { lat: location.coordinates[1], lng: location.coordinates[0] } : null;

// Customer and worker profile page. Worker-only sections render when role === 'worker'.
export default function Profile() {
  const { user, updateUser } = useAuth();
  const isWorker = user.role === 'worker';

  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    address: user.address || '',
    serviceCategory: user.serviceCategory || '',
    experienceYears: user.experienceYears ?? 0,
    bio: user.bio || '',
    isNegotiable: Boolean(user.isNegotiable),
    availability: user.availability !== false,
  });
  const [location, setLocation] = useState(toLatLng(user.location));
  const [services, setServices] = useState(user.services || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = { name: form.name, phone: form.phone, address: form.address };
      if (location) Object.assign(payload, location);
      if (isWorker) {
        Object.assign(payload, {
          serviceCategory: form.serviceCategory,
          experienceYears: Number(form.experienceYears) || 0,
          bio: form.bio,
          isNegotiable: form.isNegotiable,
          availability: form.availability,
          services: cleanServices(services),
        });
      }
      const updated = await updateProfile(payload);
      updateUser(updated);
      setServices(updated.services || []);
      setMessage({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err, 'Could not save your profile.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <ProfileHeader user={user} onUpdated={updateUser} />

      {isWorker && <VerificationCard user={user} onUpdated={updateUser} />}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="space-y-4 card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Personal details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" value={form.name} onChange={set('name')} required />
            <FormField label="Phone" type="tel" value={form.phone} onChange={set('phone')} required />
            <FormField label="Email" value={user.email} disabled hint="Email can't be changed" />
            <FormField label="Area / address" value={form.address} onChange={set('address')} />
          </div>
          <LocationPicker value={location} onChange={setLocation} required={isWorker} />
        </section>

        {isWorker && (
          <section className="space-y-4 card p-6">
            <h2 className="text-lg font-semibold text-slate-900">Work settings</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                label="Available for new jobs"
                hint="Turn off when you're busy"
                checked={form.availability}
                onChange={set('availability')}
              />
              <Toggle
                label="Prices are negotiable"
                hint="Customers can propose a price"
                checked={form.isNegotiable}
                onChange={set('isNegotiable')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Service category" as="select" value={form.serviceCategory} onChange={set('serviceCategory')} required>
                <option value="">Choose…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </FormField>
              <FormField
                label="Years of experience"
                type="number"
                min="0"
                max="60"
                value={form.experienceYears}
                onChange={set('experienceYears')}
              />
            </div>
            <FormField label="About you" as="textarea" rows={3} value={form.bio} onChange={set('bio')} />

            <div>
              <span className="text-sm font-medium text-slate-700">Services and prices</span>
              <div className="mt-2">
                <ServicesEditor services={services} onChange={setServices} />
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {message && (
            <span className={`text-sm ${message.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</span>
          )}
        </div>
      </form>
    </div>
  );
}

function ProfileHeader({ user, onUpdated }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      onUpdated(await uploadProfilePhoto(file));
    } catch (err) {
      setError(errorMessage(err, 'Could not upload photo.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="flex flex-col items-center gap-4 card p-6 sm:flex-row">
      <div className="relative">
        <img
          src={user.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=192`}
          alt=""
          className="h-24 w-24 rounded-full bg-slate-100 object-cover"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-slate-50"
        >
          {uploading ? '…' : '📷'}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      </div>
      <div className="text-center sm:text-left">
        <h1 className="font-display text-3xl sm:text-4xl text-navy">{user.name}</h1>
        <p className="capitalize text-slate-500">
          {user.role}
          {user.role === 'worker' && user.serviceCategory ? ` · ${user.serviceCategory}` : ''}
        </p>
        {user.role === 'worker' && (
          <p className="mt-1 text-sm text-slate-600">
            <span className="text-amber-400">★</span> {user.averageRating ? user.averageRating.toFixed(1) : 'No ratings yet'}
            {user.totalReviews ? ` · ${user.totalReviews} review${user.totalReviews === 1 ? '' : 's'}` : ''}
          </p>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}

function VerificationCard({ user, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      onUpdated(await uploadIdProof(file));
    } catch (err) {
      setError(errorMessage(err, 'Could not upload ID proof.'));
    } finally {
      setUploading(false);
    }
  };

  const verified = user.isVerified;
  return (
    <section
      className={`rounded-xl border p-5 ${verified ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`font-semibold ${verified ? 'text-emerald-800' : 'text-amber-800'}`}>
            {verified ? '✔ Verified worker' : '⏳ Verification pending'}
          </p>
          <p className={`text-sm ${verified ? 'text-emerald-700' : 'text-amber-700'}`}>
            {verified
              ? 'Customers nearby can find and book you.'
              : user.idProofUrl
                ? 'An admin will review your ID proof. You will appear in search once verified.'
                : 'Upload an ID proof to get verified.'}
          </p>
        </div>
        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-400">
          {uploading ? 'Uploading…' : user.idProofUrl ? 'Replace ID proof' : 'Upload ID proof'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>
      {verified && user.idProofUrl && (
        <p className="mt-2 text-xs text-emerald-700">Replacing your ID proof will require verification again.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="relative h-6 w-11 flex-none rounded-full bg-slate-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-blue-600 peer-checked:after:translate-x-5" />
    </label>
  );
}
