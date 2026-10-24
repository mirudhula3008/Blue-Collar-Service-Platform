import ReviewList from '../components/ReviewList';
import { useAuth } from '../context/AuthContext';

// Worker's read-only Reviews tab.
export default function WorkerReviews() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl sm:text-4xl text-navy">My reviews</h1>
      <p className="mt-1 text-slate-500">What customers have said about your work.</p>
      <section className="mt-6 card p-6">
        <ReviewList workerId={user._id} />
      </section>
    </div>
  );
}
