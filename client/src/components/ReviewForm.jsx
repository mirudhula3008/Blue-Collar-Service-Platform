import { useState } from 'react';
import StarRating from './StarRating';
import { createReview } from '../api/reviews';
import { errorMessage } from '../api/client';

const MAX_COMMENT = 1000;

// Drop-in review form for a completed booking. Module 3's My Bookings page can
// render this inline, or link to /review/:bookingId.
export default function ReviewForm({ bookingId, workerName, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please choose a star rating');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createReview({ bookingId, rating, comment });
      onSubmitted?.(result);
    } catch (err) {
      setError(errorMessage(err, 'Could not submit your review.'));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-700">
          How was your experience{workerName ? ` with ${workerName}` : ''}?
        </p>
        <div className="mt-2">
          <StarRating value={rating} onChange={setRating} size="lg" showLabel />
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Your review (optional)</span>
        <textarea
          rows={4}
          maxLength={MAX_COMMENT}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Was the work done well? On time? Fairly priced?"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <span className="mt-1 block text-right text-xs text-slate-400">
          {comment.length}/{MAX_COMMENT}
        </span>
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
