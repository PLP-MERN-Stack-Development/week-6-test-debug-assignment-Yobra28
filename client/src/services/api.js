import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Books API
export const booksAPI = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  createBook: (bookData) => api.post('/books', bookData),
  updateBook: (id, bookData) => api.put(`/books/${id}`, bookData),
  deleteBook: (id) => api.delete(`/books/${id}`),
  searchBooks: (query) => api.get('/books/search', { params: { q: query } }),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getMyTransactions: () => api.get('/users/transactions'),
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getDashboardStats: () => api.get('/users/dashboard/stats'),
};

// Transactions API
export const transactionsAPI = {
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),
  requestBook: (bookId, notes) => api.post('/transactions/request', { bookId, notes }),
  updateTransactionStatus: (id, status, notes) => 
    api.put(`/transactions/${id}/status`, { status, notes }),
  returnBook: (bookId, notes) => api.post('/transactions/return', { bookId, notes }),
  completeReturn: (id) => api.put(`/transactions/${id}/complete`),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
};

export default api; 