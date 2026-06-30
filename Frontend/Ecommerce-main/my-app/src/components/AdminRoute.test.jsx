import { Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { TestMemoryRouter } from '../test/routerTestUtils';
import AdminRoute from './AdminRoute';

const resetAuthStore = () => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
};

const renderAdminRoute = () =>
  renderWithRoutes(
    <Routes>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <h1>Store Admin</h1>
          </AdminRoute>
        }
      />
      <Route path="/account" element={<h1>Account page</h1>} />
    </Routes>
  );

const renderWithRoutes = (children) =>
  render(<TestMemoryRouter initialEntries={['/admin']}>{children}</TestMemoryRouter>);

beforeEach(() => {
  resetAuthStore();
});

test('redirects unauthenticated users to account', () => {
  renderAdminRoute();

  expect(screen.getByRole('heading', { name: /account page/i })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /store admin/i })).not.toBeInTheDocument();
});

test('renders admin children in demo mode for authenticated non-admin users', () => {
  useAuthStore.setState({
    user: { name: 'Customer', email: 'customer@example.com', isAdmin: false },
    token: 'token',
    isAuthenticated: true,
  });

  renderAdminRoute();

  expect(screen.getByRole('heading', { name: /store admin/i })).toBeInTheDocument();
  expect(screen.queryByText(/you need an admin account/i)).not.toBeInTheDocument();
});

test('renders admin children for authenticated admins', () => {
  useAuthStore.setState({
    user: { name: 'Admin', email: 'admin@example.com', isAdmin: true },
    token: 'token',
    isAuthenticated: true,
  });

  renderAdminRoute();

  expect(screen.getByRole('heading', { name: /store admin/i })).toBeInTheDocument();
});
