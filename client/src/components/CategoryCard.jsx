import { Link } from 'react-router-dom';

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/workers?category=${category.id}`}
      className="group flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
    >
      <span className="text-4xl" aria-hidden="true">
        {category.icon}
      </span>
      <div>
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">{category.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{category.description}</p>
      </div>
    </Link>
  );
}
