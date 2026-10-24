import api from './client';

// `data` is a FormData (worker, with files) or a plain object (customer).
export const register = (data) => api.post('/auth/register', data).then((r) => r.data);

export const login = (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data);

export const getProfile = () => api.get('/users/profile').then((r) => r.data);

export const updateProfile = (data) => api.put('/users/profile', data).then((r) => r.data);

const uploadSingle = (url, field, file) => {
  const form = new FormData();
  form.append(field, file);
  return api.post(url, form).then((r) => r.data);
};

export const uploadIdProof = (file) => uploadSingle('/upload/id-proof', 'idProof', file);

export const uploadProfilePhoto = (file) => uploadSingle('/upload/profile-photo', 'profilePhoto', file);

export const updateLanguage = (language) => api.patch('/users/language', { language }).then((r) => r.data);
