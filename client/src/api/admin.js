import api from './client';

export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data);

export const listUsers = (params) => api.get('/admin/users', { params }).then((r) => r.data);

export const setWorkerVerification = (workerId, isVerified) =>
  api.put(`/admin/workers/${workerId}/verify`, { isVerified }).then((r) => r.data);

export const getAdminDashboard = () => api.get('/admin/dashboard').then((r) => r.data);

export const listWorkers = (params) => api.get('/admin/workers', { params }).then((r) => r.data);

export const getWorkerAdminProfile = (id) => api.get(`/admin/workers/${id}`).then((r) => r.data);

export const setWorkerStatus = (id, { status, reason, evidence }) =>
  api.patch(`/admin/workers/${id}/status`, { status, reason, evidence }).then((r) => r.data);

export const getStatusHistory = (id) => api.get(`/admin/workers/${id}/status-history`).then((r) => r.data);

export const uploadEvidence = (file) => {
  const form = new FormData();
  form.append('evidence', file);
  return api.post('/admin/evidence', form).then((r) => r.data.url);
};

export const listCustomers = (params) => api.get('/admin/customers', { params }).then((r) => r.data);

export const listAllBookings = (params) => api.get('/admin/bookings', { params }).then((r) => r.data);
