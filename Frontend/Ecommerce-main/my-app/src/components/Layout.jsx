import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartSidebar from './CartSidebar';
import { Toaster } from 'react-hot-toast';
import ServerWakeNotice from './ServerWakeNotice';

export default function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  return (
    <div className="App">
      <Toaster position="top-right" />
      <ServerWakeNotice />
      <Header />
      <CartSidebar />
      <main>
        <Outlet />
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}
