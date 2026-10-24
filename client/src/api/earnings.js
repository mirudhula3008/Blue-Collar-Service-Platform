import api from './client';

export const getEarningsSummary = () => api.get('/earnings/summary').then((r) => r.data);

// period: 'daily' | 'weekly' | 'monthly'
export const getEarningsHistory = (period) => api.get('/earnings/history', { params: { period } }).then((r) => r.data);

export const getEarningsTransactions = (page = 1, limit = 10) =>
  api.get('/earnings/transactions', { params: { page, limit } }).then((r) => r.data);
