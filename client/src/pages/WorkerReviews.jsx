import ReviewList from '../components/ReviewList';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Worker's read-only Reviews tab.
export default function WorkerReviews() {
  const { user } = useAuth();
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl sm:text-4xl text-navy">{t('review.myReviews')}</h1>
      <p className="mt-1 text-slate-500">{t('review.myReviewsSubtitle')}</p>
      <section className="mt-6 card p-6">
        <ReviewList workerId={user._id} />
      </section>
    </div>
  );
}
