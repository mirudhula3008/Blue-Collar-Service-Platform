import api from './client';

export const createReview = ({ bookingId, rating, comment }) =>
  api.post('/reviews', { bookingId, rating, comment }).then((r) => r.data);

export const getReviewsForWorker = (workerId, page = 1, limit = 5) =>
  api.get(`/reviews/worker/${workerId}`, { params: { page, limit } }).then((r) => r.data);

export const getReviewForBooking = (bookingId) => api.get(`/reviews/booking/${bookingId}`).then((r) => r.data.review);
