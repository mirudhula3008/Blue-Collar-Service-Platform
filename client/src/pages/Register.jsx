import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../components/FormField';
import LocationPicker from '../components/LocationPicker';
import ServicesEditor, { cleanServices } from '../components/ServicesEditor';
import { homePathFor, useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { errorMessage } from '../api/client';
import { CATEGORIES } from '../data/categories';

const ROLES = [
  { id: 'customer', icon: '🏠', title: 'auth.needService', text: 'auth.needServiceText' },
  { id: 'worker', icon: '🧰', title: 'auth.offerService', text: 'auth.offerServiceText' },
];

export default function Register() {
  const { user, register } = useAuth();
  const { t } = useLanguage();
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
    if (form.password.length < 6) return t('auth.errors.passwordShort');
    if (form.password !== form.confirmPassword) return t('auth.errors.passwordMismatch');
    if (role === 'worker') {
      if (!form.serviceCategory) return t('auth.errors.chooseCategory');
      if (!location) return t('auth.errors.shareLocation');
      if (!idProof) return t('auth.errors.uploadId');
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
      setError(errorMessage(err, t('auth.errors.registerFailed')));
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-3xl text-navy sm:text-4xl">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('auth.registerSubtitle')}</p>

        <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('auth.role')}>
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
              <p className="mt-1 font-semibold text-slate-900">{t(r.title)}</p>
              <p className="text-xs text-slate-500">{t(r.text)}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('auth.fullName')} value={form.name} onChange={set('name')} autoComplete="name" required />
            <FormField label={t('auth.phone')} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" required />
            <FormField
              label={t('auth.email')}
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
              className="sm:col-span-2"
            />
            <FormField
              label={t('auth.password')}
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              hint={t('auth.passwordHint')}
              required
            />
            <FormField
              label={t('auth.confirmPassword')}
              type="password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              autoComplete="new-password"
              required
            />
            <FormField
              label={t('auth.location')}
              value={form.address}
              onChange={set('address')}
              placeholder={t('auth.addressPlaceholder')}
              className="sm:col-span-2"
            />
          </div>

          <LocationPicker value={location} onChange={setLocation} required={role === 'worker'} />

          {role === 'worker' && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h2 className="font-semibold text-slate-900">{t('auth.workDetails')}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('auth.category')} as="select" value={form.serviceCategory} onChange={set('serviceCategory')} required>
                  <option value="">{t('auth.choose')}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {t(`services.${c.id}`)}
                    </option>
                  ))}
                </FormField>
                <FormField
                  label={t('auth.experience')}
                  type="number"
                  min="0"
                  max="60"
                  value={form.experienceYears}
                  onChange={set('experienceYears')}
                />
              </div>
              <FormField
                label={t('auth.about')}
                as="textarea"
                rows={3}
                value={form.bio}
                onChange={set('bio')}
                placeholder={t('auth.aboutPlaceholder')}
              />

              <div>
                <span className="text-sm font-medium text-slate-700">{t('auth.servicesPrices')}</span>
                <p className="mb-2 text-xs text-slate-400">{t('auth.servicesLater')}</p>
                <ServicesEditor services={services} onChange={setServices} />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isNegotiable} onChange={set('isNegotiable')} className="h-4 w-4 accent-blue-600" />
                {t('auth.negotiable')}
              </label>

              <FileInput
                label={t('auth.idProof')}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                file={idProof}
                onChange={setIdProof}
                hint={t('auth.idProofHint')}
                required
              />
            </div>
          )}

          <FileInput
            label={t('auth.profilePhoto')}
            accept="image/jpeg,image/png,image/webp"
            file={profilePhoto}
            onChange={setProfilePhoto}
            hint={t('auth.photoHint')}
          />

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
            {submitting ? t('auth.creating') : t(role === 'worker' ? 'auth.signupWorker' : 'auth.signupCustomer')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}

function FileInput({ label, accept, file, onChange, hint, required }) {
  const { t } = useLanguage();
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
      <span className="mt-1 block text-xs text-slate-400">{file ? t('auth.selectedFile', { name: file.name }) : hint}</span>
    </label>
  );
}
