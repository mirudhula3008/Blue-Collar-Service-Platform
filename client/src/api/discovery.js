import api from './client';

export const getCategories = () => api.get('/categories').then((r) => r.data);

export const searchWorkers = (params) => api.get('/workers', { params }).then((r) => r.data);

export const getWorker = (id) => api.get(`/workers/${id}`).then((r) => r.data);
