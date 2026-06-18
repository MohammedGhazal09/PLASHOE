import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { config } from '../config/config';
import { serverWakeMonitor } from '../services/serverWakeMonitor';

const axiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (requestConfig) => {
    serverWakeMonitor.startRequest();
    requestConfig.metadata = {
      ...(requestConfig.metadata || {}),
      serverWakeTracked: true,
    };

    const token = useAuthStore.getState().token;
    if (token) {
      requestConfig.headers = requestConfig.headers || {};
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config?.metadata?.serverWakeTracked) {
      serverWakeMonitor.finishRequest();
    }

    return response;
  },
  (error) => {
    if (error.config?.metadata?.serverWakeTracked) {
      serverWakeMonitor.finishRequest();
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
