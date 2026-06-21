import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TestMemoryRouter } from '../test/routerTestUtils';
import ProtectedRoute from './ProtectedRoute';

const AccountRoute = () => {
  const location = useLocation();
  return (
    <>
      <h1>Account route</h1>
      <p>Return path: {location.state?.from?.pathname || 'none'}</p>
    </>
  );
};

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

const renderProtectedRoute = () =>
  render(
    <TestMemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <h1>Protected checkout content</h1>
            </ProtectedRoute>
          }
        />
        <Route path="/account" element={<AccountRoute />} />
      </Routes>
    </TestMemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
});

test('redirects unauthenticated users to the account route', () => {
  renderProtectedRoute();

  expect(screen.getByRole('heading', { name: /account route/i })).toBeInTheDocument();
  expect(screen.getByText(/return path: \/checkout/i)).toBeInTheDocument();
  expect(screen.queryByText(/protected checkout content/i)).not.toBeInTheDocument();
});

test('renders protected children for authenticated users', () => {
  useAuthStore.setState({
    user: { name: 'Test User' },
    token: 'test-token',
    isAuthenticated: true,
  });

  renderProtectedRoute();

  expect(screen.getByRole('heading', { name: /protected checkout content/i })).toBeInTheDocument();
});
