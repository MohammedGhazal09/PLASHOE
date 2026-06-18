import { vi } from 'vitest';
import { act } from '@testing-library/react';
import axiosInstance from '../api/axios';
import { authApi } from '../api/authApi';
import { serverWakeMonitor } from '../services/serverWakeMonitor';
import { useAuthStore } from './authStore';

vi.mock('../api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    addAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}));

const resetAuthStore = () => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  serverWakeMonitor.resetForTests();
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
};

beforeEach(resetAuthStore);

test('persists authenticated state to session storage only', async () => {
  const user = {
    _id: 'user-1',
    name: 'Session User',
    email: 'session@example.com',
    token: 'session-token',
  };
  authApi.login.mockResolvedValue({ success: true, data: user });

  await act(async () => {
    await useAuthStore.getState().login('session@example.com', 'secret123');
  });

  const persisted = JSON.parse(sessionStorage.getItem('auth-storage'));

  expect(localStorage.getItem('auth-storage')).toBeNull();
  expect(persisted.state).toMatchObject({
    token: 'session-token',
    user,
    isAuthenticated: true,
  });
});

test('logout clears authenticated state in store and session storage', async () => {
  authApi.login.mockResolvedValue({
    success: true,
    data: {
      _id: 'user-1',
      name: 'Session User',
      email: 'session@example.com',
      token: 'session-token',
    },
  });

  await act(async () => {
    await useAuthStore.getState().login('session@example.com', 'secret123');
    useAuthStore.getState().logout();
  });

  const persisted = JSON.parse(sessionStorage.getItem('auth-storage'));

  expect(useAuthStore.getState()).toMatchObject({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  expect(persisted.state).toMatchObject({
    token: null,
    user: null,
    isAuthenticated: false,
  });
});

test('axios request interceptor attaches bearer token from the auth store', () => {
  useAuthStore.setState({
    user: { _id: 'user-1' },
    token: 'session-token',
    isAuthenticated: true,
  });

  const request = axiosInstance.interceptors.request.handlers[0].fulfilled({ headers: {} });

  expect(request.headers.Authorization).toBe('Bearer session-token');
  expect(request.metadata.serverWakeTracked).toBe(true);
  expect(serverWakeMonitor.getSnapshot().pending).toBe(true);

  const response = axiosInstance.interceptors.response.handlers[0].fulfilled({ config: request });

  expect(response.config).toBe(request);
  expect(serverWakeMonitor.getSnapshot().pending).toBe(false);
});

test('axios response interceptor logs out on 401 responses', async () => {
  useAuthStore.setState({
    user: { _id: 'user-1' },
    token: 'session-token',
    isAuthenticated: true,
  });

  const request = axiosInstance.interceptors.request.handlers[0].fulfilled({ headers: {} });
  const error = { config: request, response: { status: 401 } };

  await expect(axiosInstance.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);
  expect(serverWakeMonitor.getSnapshot().pending).toBe(false);
  expect(useAuthStore.getState()).toMatchObject({
    user: null,
    token: null,
    isAuthenticated: false,
  });
});

test('axios response interceptor clears tracking on non-auth request failures', async () => {
  const request = axiosInstance.interceptors.request.handlers[0].fulfilled({ headers: {} });
  const error = { config: request, response: { status: 500 } };

  await expect(axiosInstance.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);

  expect(serverWakeMonitor.getSnapshot().pending).toBe(false);
});
