import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ProtectedRoute from './ProtectedRoute';

jest.mock('../api/authApi', () => ({
  authApi: {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
    updateProfile: jest.fn(),
    addAddress: jest.fn(),
    deleteAddress: jest.fn(),
  },
}));

const renderProtectedRoute = () =>
  render(
    <MemoryRouter
      initialEntries={['/checkout']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <h1>Protected checkout content</h1>
            </ProtectedRoute>
          }
        />
        <Route path="/account" element={<h1>Account route</h1>} />
      </Routes>
    </MemoryRouter>
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
