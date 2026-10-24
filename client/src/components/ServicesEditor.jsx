import { controlClass } from './FormField';

const EMPTY = { name: '', price: '', unit: 'per job' };

// Editable list of { name, price, unit } rows.
export default function ServicesEditor({ services, onChange }) {
  const update = (i, key, value) => onChange(services.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  const remove = (i) => onChange(services.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {services.length === 0 && <p className="text-sm text-slate-400">No services added yet.</p>}
      {services.map((s, i) => (
        <div key={s._id || i} className="grid grid-cols-[1fr_96px_auto] gap-2 sm:grid-cols-[1fr_110px_110px_auto]">
          <input
            className={controlClass}
            placeholder="Service name"
            value={s.name}
            onChange={(e) => update(i, 'name', e.target.value)}
            aria-label={`Service ${i + 1} name`}
            required
          />
          <input
            className={controlClass}
            type="number"
            min="0"
            placeholder="₹ Price"
            value={s.price}
            onChange={(e) => update(i, 'price', e.target.value)}
            aria-label={`Service ${i + 1} price`}
            required
          />
          <select
            className={`${controlClass} hidden sm:block`}
            value={s.unit || 'per job'}
            onChange={(e) => update(i, 'unit', e.target.value)}
            aria-label={`Service ${i + 1} unit`}
          >
            <option>per job</option>
            <option>per hour</option>
            <option>per sq ft</option>
            <option>per visit</option>
          </select>
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove service ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...services, { ...EMPTY }])}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        + Add service
      </button>
    </div>
  );
}

// Converts editor rows to the API shape, dropping empty rows.
export const cleanServices = (services) =>
  services
    .filter((s) => s.name.trim() && s.price !== '')
    .map((s) => ({ name: s.name.trim(), price: Number(s.price), unit: s.unit || 'per job' }));
