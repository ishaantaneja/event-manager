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
  
  // Don't retry non-retriable errors (including 429 rate limiting)
  const nonRetriableStatuses = [400, 401, 403, 404, 422, 429];
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
        // Rate limiting - DON'T retry automatically to avoid cascading failures
        // Just show error once and let circuit breaker handle it
        if (!error.config._rateLimitErrorShown) {
          error.config._rateLimitErrorShown = true;
          toast.error('Too many requests - slowing down automatically');
        }
        // Don't retry, just reject
        break;
        
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

// Connection monitor with circuit breaker pattern (resilience engineering)
let healthCheckInterval;
let consecutiveFailures = 0;
const MAX_FAILURES = 3; // Circuit breaker threshold

export const startHealthMonitoring = (interval = 180000) => { // Increased from 60s to 180s (3 minutes) to reduce API calls
  // Clear any existing interval to prevent memory leaks & duplicate polling
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      const health = await checkHealth();
      
      if (health.status !== 'OK') {
        consecutiveFailures++;
        console.warn(`Backend health degraded (${consecutiveFailures}/${MAX_FAILURES}):`, health);
        
        // Circuit breaker: stop monitoring after too many failures to avoid thundering herd problem
        if (consecutiveFailures >= MAX_FAILURES) {
          console.error('Circuit breaker triggered - stopping health checks to prevent rate limiting');
          stopHealthMonitoring();
          toast.error('Connection issues detected - please refresh the page if needed');
        }
      } else {
        // Reset failure counter on success (circuit closed)
        consecutiveFailures = 0;
      }
    } catch (error) {
      consecutiveFailures++;
      console.error('Health check error:', error);
      
      // Trigger circuit breaker
      if (consecutiveFailures >= MAX_FAILURES) {
        console.error('Circuit breaker opened - stopping health monitoring');
        stopHealthMonitoring();
      }
    }
  }, interval);
};

export const stopHealthMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
};

export default api;
