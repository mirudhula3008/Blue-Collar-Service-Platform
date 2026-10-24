import { useState } from 'react';
import StarRating from './StarRating';
import { createReview } from '../api/reviews';
import { errorMessage } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const MAX_COMMENT = 1000;

// Drop-in review form for a completed booking. Module 3's My Bookings page can
// render this inline, or link to /review/:bookingId.
export default function ReviewForm({ bookingId, workerName, onSubmitted }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError(t('review.chooseRating'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createReview({ bookingId, rating, comment });
      onSubmitted?.(result);
    } catch (err) {
      setError(errorMessage(err, t('review.submitFailed')));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-700">
          {workerName ? t('review.howWasWith', { name: workerName }) : t('review.rateExperience')}
        </p>
        <div className="mt-2">
          <StarRating value={rating} onChange={setRating} size="lg" showLabel />
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">{t('review.yourReview')}</span>
        <textarea
          rows={4}
          maxLength={MAX_COMMENT}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('review.placeholder')}
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
        className="btn btn-primary w-full py-3"
      >
        {submitting ? t('review.submitting') : t('review.submit')}
      </button>
    </form>
  );
}
