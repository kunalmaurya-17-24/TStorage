import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://tstorage.onrender.com/api',
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
    // console.group('Axios Request')
    // console.log('URL:', config.url)
    // console.log('Method:', config.method)
    // console.log('Headers:', config.headers)
    // console.log('Params:', config.params)
    // console.groupEnd()

    return config
  },
  error => {
    return Promise.reject(error)
  }
);

// Add a response interceptor for logging
axiosInstance.interceptors.response.use(
  response => {
    // console.group('Axios Response')
    // console.log('URL:', response.config.url)
    // console.log('Status:', response.status)
    // console.log('Data:', response.data)
    // console.groupEnd()
    return response;
  },
  error => {
    // console.group('Axios Error')
    // console.error('Error Details:', error)
    // if (error.response) {
    //   console.error('Response Status:', error.response.status)
    //   console.error('Response Data:', error.response.data)
    // }
    // console.groupEnd()
    return Promise.reject(error)
  }
);

export default axiosInstance;
