import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const dashboardApi = {
  getOverview: () => api.get('/dashboard')
};

export const coopsApi = {
  getAll: () => api.get('/coops'),
  update: (id, data) => api.put(`/coops/${id}`, data),
  logPopulation: (data) => api.post('/coops/population', data),
  getLogs: () => api.get('/coops/population/logs')
};

export const eggsApi = {
  getAll: (params) => api.get('/eggs', { params }),
  getLatest: () => api.get('/eggs/latest'),
  create: (data) => api.post('/eggs', data),
  update: (id, data) => api.put(`/eggs/${id}`, data),
  delete: (id) => api.delete(`/eggs/${id}`)
};

export const feedApi = {
  getItems: () => api.get('/feed/items'),
  purchase: (data) => api.post('/feed/purchase', data),
  use: (data) => api.post('/feed/usage', data),
  markPurchaseAsPaid: (id) => api.put(`/feed/purchases/${id}/pay`),
  getPurchases: () => api.get('/feed/purchases'),
  getUsages: () => api.get('/feed/usages')
};

export const inventoryApi = {
  getStatus: () => api.get('/inventory/status'),
  sell: (data) => api.post('/inventory/sale', data),
  getHistory: () => api.get('/inventory/history'),
  deleteHistory: (id) => api.delete(`/inventory/history/${id}`)
};

export const financeApi = {
  getSummary: () => api.get('/finance/summary'),
  getTransactions: (params) => api.get('/finance/transactions', { params }),
  createTransaction: (data) => api.post('/finance/transactions', data),
  deleteTransaction: (id) => api.delete(`/finance/transactions/${id}`)
};

export const reportsApi = {
  getMonthly: (params) => api.get('/reports/monthly', { params }),
  getYearly: (params) => api.get('/reports/yearly', { params })
};

export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (data) => api.post('/settings', data),
  getBackupUrl: () => `${API_BASE_URL}/settings/backup`
};

export default api;
