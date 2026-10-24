import { Bike, Car, Cog, Hammer, KeyRound, Paintbrush, Refrigerator, Sparkles, Wrench, Zap } from 'lucide-react';

// Line icon + tile tint per service category (theme guide §5–6). Names and blurbs live in the locale files.
export const CATEGORY_META = {
  plumbing: { Icon: Wrench, tile: 'bg-blue-50 text-blue-600' },
  electrical: { Icon: Zap, tile: 'bg-amber-100 text-amber-700' },
  carpentry: { Icon: Hammer, tile: 'bg-slate-100 text-slate-700' },
  painting: { Icon: Paintbrush, tile: 'bg-blue-50 text-blue-600' },
  cleaning: { Icon: Sparkles, tile: 'bg-emerald-50 text-emerald-700' },
  appliance_repair: { Icon: Refrigerator, tile: 'bg-slate-100 text-slate-700' },
  vehicle_rental: { Icon: KeyRound, tile: 'bg-amber-100 text-amber-700' },
  car_wash: { Icon: Car, tile: 'bg-blue-50 text-blue-600' },
  bike_wash: { Icon: Bike, tile: 'bg-emerald-50 text-emerald-700' },
  mechanic: { Icon: Cog, tile: 'bg-slate-100 text-slate-700' },
};

export default function CategoryIcon({ id, size = 'md', tinted = true }) {
  const meta = CATEGORY_META[id] || CATEGORY_META.plumbing;
  const { Icon } = meta;
  const box = size === 'lg' ? 'h-14 w-14 rounded-2xl' : size === 'sm' ? 'h-9 w-9 rounded-lg' : 'h-12 w-12 rounded-xl';
  const icon = size === 'lg' ? 28 : size === 'sm' ? 18 : 24;
  return (
    <span className={`inline-flex flex-none items-center justify-center ${box} ${tinted ? meta.tile : 'text-blue-600'}`} aria-hidden="true">
      <Icon size={icon} strokeWidth={1.75} />
    </span>
  );
}
