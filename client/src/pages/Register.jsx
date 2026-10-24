import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../components/FormField';
import LocationPicker from '../components/LocationPicker';
import ServicesEditor, { cleanServices } from '../components/ServicesEditor';
import { homePathFor, useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import { CATEGORIES } from '../data/categories';

const ROLES = [
  { id: 'customer', icon: '🏠', title: 'I need a service', text: 'Find and book workers near you' },
  { id: 'worker', icon: '🧰', title: 'I offer services', text: 'Get bookings from nearby customers' },
];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [role, setRole] = useState(params.get('role') === 'worker' ? 'worker' : 'customer');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    serviceCategory: '',
    experienceYears: '',
    bio: '',
    isNegotiable: false,
  });
  const [location, setLocation] = useState(null);
  const [services, setServices] = useState([]);
  const [idProof, setIdProof] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const validate = () => {
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (role === 'worker') {
      if (!form.serviceCategory) return 'Please choose your service category';
      if (!location) return 'Please share your location so customers can find you';
      if (!idProof) return 'Please upload an ID proof';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const data = new FormData();
    data.append('role', role);
    ['name', 'email', 'phone', 'password', 'address'].forEach((k) => data.append(k, form[k]));
    if (location) {
      data.append('lat', location.lat);
      data.append('lng', location.lng);
    }
    if (profilePhoto) data.append('profilePhoto', profilePhoto);
    if (role === 'worker') {
      data.append('serviceCategory', form.serviceCategory);
      data.append('experienceYears', form.experienceYears || 0);
      data.append('bio', form.bio);
      data.append('isNegotiable', form.isNegotiable);
      data.append('services', JSON.stringify(cleanServices(services)));
      data.append('idProof', idProof);
    }

    setError(null);
    setSubmitting(true);
    try {
      const created = await register(data);
      navigate(created.role === 'worker' ? '/profile' : homePathFor(created.role), { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-3xl sm:text-4xl text-navy">Create your account</h1>

        <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={role === r.id}
              onClick={() => setRole(r.id)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                role === r.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {r.icon}
              </span>
              <p className="mt-1 font-semibold text-slate-900">{r.title}</p>
              <p className="text-xs text-slate-500">{r.text}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" value={form.name} onChange={set('name')} autoComplete="name" required />
            <FormField label="Phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" required />
            <FormField
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
              className="sm:col-span-2"
            />
            <FormField
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              hint="At least 6 characters"
              required
            />
            <FormField
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              autoComplete="new-password"
              required
            />
            <FormField
              label="Area / address"
              value={form.address}
              onChange={set('address')}
              placeholder="e.g. T. Nagar, Chennai"
              className="sm:col-span-2"
            />
          </div>

          <LocationPicker value={location} onChange={setLocation} required={role === 'worker'} />

          {role === 'worker' && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h2 className="font-semibold text-slate-900">Work details</h2>
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
              <FormField
                label="About you"
                as="textarea"
                rows={3}
                value={form.bio}
                onChange={set('bio')}
                placeholder="What kind of jobs do you do best?"
              />

              <div>
                <span className="text-sm font-medium text-slate-700">Services and prices</span>
                <p className="mb-2 text-xs text-slate-400">You can add or change these later from your profile.</p>
                <ServicesEditor services={services} onChange={setServices} />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isNegotiable} onChange={set('isNegotiable')} className="h-4 w-4 accent-blue-600" />
                My prices are negotiable
              </label>

              <FileInput
                label="ID proof (Aadhaar, PAN, driving licence…)"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                file={idProof}
                onChange={setIdProof}
                hint="JPG, PNG, WEBP or PDF, up to 5 MB. Used only to verify your identity."
                required
              />
            </div>
          )}

          <FileInput
            label="Profile photo (optional)"
            accept="image/jpeg,image/png,image/webp"
            file={profilePhoto}
            onChange={setProfilePhoto}
            hint="JPG, PNG or WEBP, up to 5 MB"
          />

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full py-3"
          >
            {submitting ? 'Creating account…' : `Sign up as a ${role}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function FileInput({ label, accept, file, onChange, hint, required }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files[0] || null)}
        className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-100"
      />
      <span className="mt-1 block text-xs text-slate-400">{file ? `Selected: ${file.name}` : hint}</span>
    </label>
  );
}
