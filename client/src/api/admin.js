import api from './client';

export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data);

export const listUsers = (params) => api.get('/admin/users', { params }).then((r) => r.data);

export const setWorkerVerification = (workerId, isVerified) =>
  api.put(`/admin/workers/${workerId}/verify`, { isVerified }).then((r) => r.data);
