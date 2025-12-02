import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api` || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Competitions
export const competitionsAPI = {
  getAll: (tag) => api.get('/competitions', { params: { tag } }),
  getById: (id) => api.get(`/competitions/${id}`),
  create: (data) => api.post('/competitions', data),
  update: (id, data) => api.put(`/competitions/${id}`, data),
  delete: (id) => api.delete(`/competitions/${id}`),
};

// Cart
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (item) => api.post('/cart/add', item),
  update: (competitionId, quantity) => api.post('/cart/update', { competition_id: competitionId, quantity }),
  clear: () => api.delete('/cart/clear'),
  applyCoupon: (code) => api.post('/cart/apply-coupon', null, { params: { code } }),
};

// Checkout
export const checkoutAPI = {
  validate: () => api.post('/checkout/validate'),
  complete: (data) => api.post('/checkout/complete', data),
};

// Orders
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
};

// Theme
export const themeAPI = {
  get: () => api.get('/theme'),
  update: (data) => api.put('/theme', data),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
};

// File upload
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;
