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
    setDefaultAddress: vi.fn(),
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

test('addAddress stores returned addresses on the authenticated user', async () => {
  useAuthStore.setState({
    user: { _id: 'user-1', name: 'Session User', email: 'session@example.com' },
    token: 'session-token',
    isAuthenticated: true,
  });
  const addresses = [
    {
      _id: 'address-1',
      firstName: 'Test',
      lastName: 'Buyer',
      street: '123 Test Street',
      city: 'Testville',
      state: 'CA',
      zipCode: '90210',
      country: 'United States',
      phone: '5551234567',
      isDefault: true,
    },
  ];
  authApi.addAddress.mockResolvedValue({ success: true, data: addresses });

  let result;
  await act(async () => {
    result = await useAuthStore.getState().addAddress(addresses[0]);
  });

  expect(result).toEqual({ success: true, data: addresses });
  expect(useAuthStore.getState().user.addresses).toEqual(addresses);
});

test('setDefaultAddress stores returned addresses on the authenticated user', async () => {
  useAuthStore.setState({
    user: {
      _id: 'user-1',
      name: 'Session User',
      email: 'session@example.com',
      addresses: [
        { _id: 'address-1', firstName: 'Home', isDefault: true },
        { _id: 'address-2', firstName: 'Office', isDefault: false },
      ],
    },
    token: 'session-token',
    isAuthenticated: true,
  });
  const addresses = [
    { _id: 'address-1', firstName: 'Home', isDefault: false },
    { _id: 'address-2', firstName: 'Office', isDefault: true },
  ];
  authApi.setDefaultAddress.mockResolvedValue({ success: true, data: addresses });

  let result;
  await act(async () => {
    result = await useAuthStore.getState().setDefaultAddress('address-2');
  });

  expect(authApi.setDefaultAddress).toHaveBeenCalledWith('address-2');
  expect(result).toEqual({ success: true, data: addresses });
  expect(useAuthStore.getState().user.addresses).toEqual(addresses);
});

test('deleteAddress stores returned addresses on the authenticated user', async () => {
  useAuthStore.setState({
    user: {
      _id: 'user-1',
      name: 'Session User',
      email: 'session@example.com',
      addresses: [
        { _id: 'address-1', firstName: 'Home', isDefault: true },
        { _id: 'address-2', firstName: 'Office', isDefault: false },
      ],
    },
    token: 'session-token',
    isAuthenticated: true,
  });
  const addresses = [{ _id: 'address-2', firstName: 'Office', isDefault: true }];
  authApi.deleteAddress.mockResolvedValue({ success: true, data: addresses });

  let result;
  await act(async () => {
    result = await useAuthStore.getState().deleteAddress('address-1');
  });

  expect(authApi.deleteAddress).toHaveBeenCalledWith('address-1');
  expect(result).toEqual({ success: true, data: addresses });
  expect(useAuthStore.getState().user.addresses).toEqual(addresses);
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
