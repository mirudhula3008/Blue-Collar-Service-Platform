// Base control styles without margin, for inputs laid out in grids.
export const controlClass = 'input';

export const inputClass = `mt-1 ${controlClass}`;

// Label + input wrapper. Pass `as="select"` or `as="textarea"` for other controls.
export default function FormField({ label, hint, as: Tag = 'input', children, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-navy">{label}</span>
      <Tag className={inputClass} {...props}>
        {children}
      </Tag>
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
