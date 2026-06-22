import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faUser, faBars, faXmark, faHeart } from '@fortawesome/free-solid-svg-icons';
import Drawer from '@mui/material/Drawer';
import Badge from '@mui/material/Badge';
import { config } from '../config/config';
import { useAuthStore } from '../store/authStore';
import { useCartStore, selectItemCount } from '../store/cartStore';
import { useWishlistStore, selectWishlistCount } from '../store/wishlistStore';
import siteLogo from '../assets/images/site-logo.webp';

const navLinks = [
  { to: '/men', label: 'MEN' },
  { to: '/women', label: 'WOMEN' },
  { to: '/collection', label: 'COLLECTION' },
  { to: '/lookbook', label: 'LOOKBOOK' },
  { to: '/sale', label: 'SALE' },
];

const rightLinks = [
  { to: '/ourstory', label: 'OUR STORY' },
  { to: '/contact', label: 'CONTACT' },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { openCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  
  const itemCount = useCartStore(selectItemCount);
  const wishlistCount = useWishlistStore(selectWishlistCount);
  const syncWishlist = useWishlistStore((state) => state.syncWishlist);
  const wishlistEnabled = config.features.wishlist;
  const adminLink = user?.isAdmin ? [{ to: '/admin', label: 'ADMIN' }] : [];
  const wishlistLink = wishlistEnabled
    ? [{ to: '/account', label: 'WISHLIST', state: { tab: 'wishlist' } }]
    : [];

  useEffect(() => {
    if (wishlistEnabled && isAuthenticated) {
      syncWishlist();
    }
  }, [isAuthenticated, syncWishlist, wishlistEnabled]);

  const isActiveLink = (path) => location.pathname === path;

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      {/* Main Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="button-control button-control--plain-icon button-control--mobile-only"
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={faBars} className="text-xl" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img src={siteLogo} alt="PLASHOE" className="w-40 md:w-56 h-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActiveLink(link.to) ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="flex items-center gap-6">
            {[...adminLink, ...rightLinks].map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${
                    isActiveLink(link.to) ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-4">
          {wishlistEnabled && (
            <Link
              to="/account"
              state={{ tab: 'wishlist' }}
              className="p-2 text-dark hover:text-primary transition-colors"
              aria-label={`Wishlist (${wishlistCount} ${wishlistCount === 1 ? 'item' : 'items'})`}
            >
              <Badge
                badgeContent={wishlistCount}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#b42318',
                    color: 'white',
                    fontSize: '0.7rem',
                    minWidth: '18px',
                    height: '18px',
                  },
                }}
              >
                <FontAwesomeIcon icon={faHeart} className="text-xl" />
              </Badge>
            </Link>
          )}
          <button
            onClick={openCart}
            className="button-control button-control--plain-icon"
            aria-label="Open cart"
          >
            <Badge
              badgeContent={itemCount}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#262b2c',
                  color: 'white',
                  fontSize: '0.7rem',
                  minWidth: '18px',
                  height: '18px',
                },
              }}
            >
              <FontAwesomeIcon icon={faBagShopping} className="text-xl" />
            </Badge>
          </button>
          <Link
            to="/account"
            className="p-2 text-dark hover:text-primary transition-colors"
            aria-label="Account"
          >
            <FontAwesomeIcon icon={faUser} className="text-xl" />
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 320 } },
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <img src={siteLogo} alt="PLASHOE" className="w-40 h-auto" />
            <button
              onClick={() => setDrawerOpen(false)}
              className="button-control button-control--plain-icon"
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>
          </div>
          <nav className="flex-1 py-4">
            <ul>
              {[...navLinks, ...wishlistLink, ...adminLink, ...rightLinks].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    state={link.state}
                    onClick={() => setDrawerOpen(false)}
                    className={`block px-6 py-4 text-lg border-b border-gray-100 transition-colors hover:bg-light ${
                      isActiveLink(link.to) ? 'text-primary font-medium' : 'text-gray-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Drawer>
    </header>
  );
}
