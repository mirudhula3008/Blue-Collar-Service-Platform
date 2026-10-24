import axios from 'axios';

// Shared axios instance. Each module keeps its own calls in a separate
// file under src/api/ so this file stays identical across branches.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
});

// Attach the JWT saved at login (Module 1), if present.
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // storage unavailable — continue unauthenticated
  }
  return config;
});

export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || fallback;

export default api;
