import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://tstorage-1.onrender.com/api'
    : 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Add a request interceptor to include the token and log requests
axiosInstance.interceptors.request.use(
  config => {
    // Add timestamp to prevent caching
    config.params = config.params || {};
    config.params['_'] = new Date().getTime();

    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // Log request details

    return config
  },
  error => {
    return Promise.reject(error)
  }
);

// Add a response interceptor for logging
axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    return Promise.reject(error)
  }
);

export default axiosInstance;
