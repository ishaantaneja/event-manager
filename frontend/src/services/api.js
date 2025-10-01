import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with custom config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Retry logic with exponential backoff
const retryRequest = async (error, retries = 3) => {
  const { config, response } = error;
  
  // Don't retry if no config or max retries reached
  if (!config || !config.retryCount) {
    config.retryCount = 0;
  }
  
  if (config.retryCount >= retries) {
    return Promise.reject(error);
  }
  
  // Don't retry non-retriable errors
  const nonRetriableStatuses = [400, 401, 403, 404, 422];
  if (response && nonRetriableStatuses.includes(response.status)) {
    return Promise.reject(error);
  }
  
  config.retryCount += 1;
  
  // Exponential backoff delay
  const delay = Math.min(1000 * Math.pow(2, config.retryCount - 1), 10000);
  
  console.log(`Retrying request (${config.retryCount}/${retries}) after ${delay}ms...`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(api(config));
    }, delay);
  });
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout - server took too long to respond');
      } else if (error.message === 'Network Error') {
        // Attempt retry for network errors
        try {
          return await retryRequest(error);
        } catch (retryError) {
          toast.error('Network error - please check your connection');
        }
      }
      return Promise.reject(error);
    }
    
    // Handle specific status codes
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Unauthorized - clear auth and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
          toast.error('Session expired - please login again');
        }
        break;
        
      case 403:
        toast.error('Access denied - insufficient permissions');
        break;
        
      case 429:
        // Rate limiting - retry with backoff
        const retryAfter = error.response.headers['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        toast.error(`Too many requests - please wait ${delay/1000} seconds`);
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(api(error.config));
          }, delay);
        });
        
      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors - attempt retry
        try {
          return await retryRequest(error);
        } catch (retryError) {
          toast.error(data?.message || 'Server error - please try again later');
        }
        break;
        
      default:
        if (data?.message) {
          toast.error(data.message);
        }
    }
    
    return Promise.reject(error);
  }
);

// Health check function
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'ERROR', message: error.message };
  }
};

// Connection monitor
let healthCheckInterval;

export const startHealthMonitoring = (interval = 60000) => {
  healthCheckInterval = setInterval(async () => {
    const health = await checkHealth();
    if (health.status !== 'OK') {
      console.warn('Backend health degraded:', health);
    }
  }, interval);
};

export const stopHealthMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
};

export default api;
