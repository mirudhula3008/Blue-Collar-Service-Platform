import api from './client';

export const getCategories = () => api.get('/categories').then((r) => r.data);

export const searchWorkers = (params) => api.get('/workers', { params }).then((r) => r.data);

export const getWorker = (id) => api.get(`/workers/${id}`).then((r) => r.data);

export const getWorkerReviews = (id, page = 1, limit = 5) =>
  api.get(`/workers/${id}/reviews`, { params: { page, limit } }).then((r) => r.data);
