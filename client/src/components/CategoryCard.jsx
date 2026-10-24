import { Link } from 'react-router-dom';
import CategoryIcon from './CategoryIcon';
import { useLanguage } from '../context/LanguageContext';

// Service category tile — blue line icon, glow ring on hover (theme guide §5).
export default function CategoryCard({ category }) {
  const { t } = useLanguage();
  return (
    <Link
      to={`/workers?category=${category.id}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center shadow-card transition hover:border-blue-600 hover:shadow-glow focus:outline-none focus-visible:border-blue-600 focus-visible:shadow-glow"
    >
      <CategoryIcon id={category.id} size="lg" tinted={false} />
      <div>
        <h3 className="font-semibold text-navy">{t(`services.${category.id}`)}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{t(`services.desc.${category.id}`)}</p>
      </div>
    </Link>
  );
}
