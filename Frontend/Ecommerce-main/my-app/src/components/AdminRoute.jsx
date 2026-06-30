import { Navigate, useLocation } from 'react-router-dom';
import { AdminDemoModeProvider } from '../context/adminDemoMode';
import { useAuthStore } from '../store/authStore';

export default function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/account" state={{ from: location }} replace />;
  }

  return (
    <AdminDemoModeProvider value={user?.isAdmin !== true}>
      {children}
    </AdminDemoModeProvider>
  );
}
