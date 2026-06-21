import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/account" state={{ from: location }} replace />;
  }

  if (user?.isAdmin !== true) {
    return (
      <main className="min-h-[60vh] bg-light px-4 py-16">
        <section className="mx-auto max-w-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-xs font-semibold uppercase text-primary">Forbidden</p>
          <h1 className="mt-2 text-2xl font-semibold text-dark">You need an admin account to view this page.</h1>
          <p className="mt-3 text-sm text-gray-600">
            Sign in with an admin account or return to the storefront.
          </p>
        </section>
      </main>
    );
  }

  return children;
}
