import api from './client';

export const createPayment = ({ bookingId, method, methodDetails }) =>
  api.post('/payments', { bookingId, method, methodDetails }).then((r) => r.data);

// Resolves with the completed payment; rejects (HTTP 402) with { message, payment } when declined.
export const processPayment = (id) => api.patch(`/payments/${id}/process`).then((r) => r.data);

export const getPaymentForBooking = (bookingId) => api.get(`/payments/booking/${bookingId}`).then((r) => r.data);

export const getMyPayments = () => api.get('/payments/my').then((r) => r.data);
