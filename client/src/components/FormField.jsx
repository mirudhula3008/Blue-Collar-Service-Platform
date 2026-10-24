// Base control styles without margin, for inputs laid out in grids.
export const controlClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500';

export const inputClass = `mt-1 ${controlClass}`;

// Label + input wrapper. Pass `as="select"` or `as="textarea"` for other controls.
export default function FormField({ label, hint, as: Tag = 'input', children, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Tag className={inputClass} {...props}>
        {children}
      </Tag>
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
