import ReviewList from '../components/ReviewList';
import { useAuth } from '../context/AuthContext';

// Worker's read-only Reviews tab.
export default function WorkerReviews() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">My reviews</h1>
      <p className="mt-1 text-slate-500">What customers have said about your work.</p>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ReviewList workerId={user._id} />
      </section>
    </div>
  );
}
