import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm';
import StarRating from '../components/StarRating';
import { getReviewForBooking } from '../api/reviews';

// /review/:bookingId — Module 3 links here from a completed booking and can pass
// `state={{ booking }}` (with booking.workerId.name) to show the worker's name.
export default function ReviewPage() {
  const { bookingId } = useParams();
  const { state } = useLocation();
  const workerName = state?.booking?.workerId?.name || state?.workerName;

  const [existing, setExisting] = useState(undefined); // undefined = loading
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    getReviewForBooking(bookingId)
      .then(setExisting)
      .catch(() => setExisting(null));
  }, [bookingId]);

  const review = submitted?.review || existing;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="card p-6 sm:p-8">
        {existing === undefined ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ) : review ? (
          <div className="text-center">
            <p className="text-4xl" aria-hidden="true">
              🎉
            </p>
            <h1 className="mt-2 font-display text-3xl text-navy">
              {submitted ? 'Thanks for your review!' : 'You already reviewed this job'}
            </h1>
            <div className="mt-3">
              <StarRating value={review.rating} size="md" />
            </div>
            {review.comment && <p className="mt-3 text-slate-600">“{review.comment}”</p>}
            {submitted?.workerRating && (
              <p className="mt-4 text-sm text-slate-500">
                {workerName || 'The worker'} now has a {submitted.workerRating.averageRating.toFixed(1)}★ average from{' '}
                {submitted.workerRating.totalReviews} review{submitted.workerRating.totalReviews === 1 ? '' : 's'}.
              </p>
            )}
            <Link to="/bookings" className="mt-6 inline-block font-medium text-blue-600 hover:underline">
              ← Back to my bookings
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-6 font-display text-3xl text-navy">Rate this job</h1>
            <ReviewForm bookingId={bookingId} workerName={workerName} onSubmitted={setSubmitted} />
          </>
        )}
      </div>
    </div>
  );
}
