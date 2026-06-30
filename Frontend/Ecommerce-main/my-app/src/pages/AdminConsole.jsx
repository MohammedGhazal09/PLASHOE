import { useLayoutEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBell, faBoxOpen, faChartLine, faClipboardList, faEnvelope, faImages, faNewspaper, faStar, faTags } from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../api/adminApi';
import { useAdminDemoMode } from '../context/adminDemoMode';
import AdminDashboard from './admin/AdminDashboard';
import AdminOrders from './admin/AdminOrders';
import AdminReturns from './admin/AdminReturns';
import AdminProducts from './admin/AdminProducts';
import AdminLookbook from './admin/AdminLookbook';
import AdminCoupons from './admin/AdminCoupons';
import AdminMessages from './admin/AdminMessages';
import AdminBackInStock from './admin/AdminBackInStock';
import AdminNewsletter from './admin/AdminNewsletter';
import AdminReviews from './admin/AdminReviews';

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: faChartLine, Component: AdminDashboard },
  { id: 'orders', label: 'Orders', icon: faClipboardList, Component: AdminOrders },
  { id: 'returns', label: 'Returns', icon: faArrowsRotate, Component: AdminReturns },
  { id: 'backInStock', label: 'Restock', icon: faBell, Component: AdminBackInStock },
  { id: 'newsletter', label: 'Newsletter', icon: faNewspaper, Component: AdminNewsletter },
  { id: 'reviews', label: 'Reviews', icon: faStar, Component: AdminReviews },
  { id: 'products', label: 'Products', icon: faBoxOpen, Component: AdminProducts },
  { id: 'lookbook', label: 'Lookbook', icon: faImages, Component: AdminLookbook },
  { id: 'coupons', label: 'Coupons', icon: faTags, Component: AdminCoupons },
  { id: 'messages', label: 'Messages', icon: faEnvelope, Component: AdminMessages },
];

export default function AdminConsole() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const adminDemoMode = useAdminDemoMode();
  const active = useMemo(
    () => sections.find((section) => section.id === activeSection) || sections[0],
    [activeSection]
  );
  const ActiveComponent = active.Component;

  useLayoutEffect(() => {
    adminApi.setDemoMode(adminDemoMode);

    return () => {
      adminApi.setDemoMode(false);
    };
  }, [adminDemoMode]);

  return (
    <main className="min-h-screen bg-light">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="lg:w-64 lg:flex-shrink-0">
          <div className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase text-primary">PLASHOE</p>
              <h1 className="mt-1 text-2xl font-semibold text-dark">Store Admin</h1>
            </div>
            <nav className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-1" aria-label="Admin sections">
              {sections.map((section) => {
                const activeItem = section.id === activeSection;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`button-control button-control--full button-control--start button-control--compact ${
                      activeItem ? 'button-control--dark' : 'button-control--secondary'
                    }`}
                    aria-current={activeItem ? 'page' : undefined}
                  >
                    <FontAwesomeIcon icon={section.icon} className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-4">
          {adminDemoMode && (
            <div
              id="admin-demo-mode-notice"
              role="status"
              className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <p className="font-semibold">Demo admin preview</p>
              <p className="mt-1">
                This portfolio account can inspect sample operations data, but write actions are disabled because it is not a real administrator account.
              </p>
            </div>
          )}
          <fieldset
            disabled={adminDemoMode}
            aria-describedby={adminDemoMode ? 'admin-demo-mode-notice' : undefined}
            className="m-0 min-w-0 border-0 p-0"
          >
            <legend className="sr-only">Admin section controls</legend>
            <ActiveComponent />
          </fieldset>
        </section>
      </div>
    </main>
  );
}
