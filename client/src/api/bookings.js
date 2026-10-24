import api from './client';

export const createBooking = (data) => api.post('/bookings', data).then((r) => r.data);

export const getCustomerBookings = (status) =>
  api.get('/bookings/customer', { params: { status } }).then((r) => r.data);

export const getWorkerBookings = (status) => api.get('/bookings/worker', { params: { status } }).then((r) => r.data);

export const getBooking = (id) => api.get(`/bookings/${id}`).then((r) => r.data);

// action: 'accept' | 'reject' | 'start' | 'complete' | 'cancel'
export const updateBookingStatus = (id, action) => api.put(`/bookings/${id}/${action}`).then((r) => r.data);

// Worker profile comes from Module 2's GET /api/workers/:id.
export const getWorkerProfile = (id) => api.get(`/workers/${id}`).then((r) => r.data);
