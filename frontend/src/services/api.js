import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Function to set auth token (THIS WAS MISSING!)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
    console.log('Token set in axios defaults');
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    console.log('Token cleared from axios defaults');
  }
};

// Request interceptor to add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token attached to request'); // Debug log
    } else {
      console.warn('No token found in localStorage'); // Debug log
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token may be invalid or expired');
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Initialize token from localStorage when app starts
const storedToken = localStorage.getItem('token');
if (storedToken) {
  setAuthToken(storedToken);
  console.log('🔄 Token restored from localStorage on app init');
}

export default api;