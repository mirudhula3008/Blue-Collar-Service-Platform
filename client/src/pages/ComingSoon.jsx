import { Link } from 'react-router-dom';

// Stand-in for pages owned by other modules until the branches are merged.
export default function ComingSoon({ title, module }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">This page is built in {module} and appears here after merging.</p>
      <Link to="/profile" className="mt-6 inline-block font-medium text-blue-600 hover:underline">
        Go to your profile →
      </Link>
    </div>
  );
}
