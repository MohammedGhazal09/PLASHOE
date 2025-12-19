import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartSidebar from './CartSidebar';
import { Toaster } from 'react-hot-toast';

export default function Layout() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <Header />
      <CartSidebar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
