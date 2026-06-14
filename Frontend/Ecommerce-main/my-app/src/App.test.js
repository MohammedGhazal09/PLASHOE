import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    addAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}));

vi.mock('./api/cartApi', () => ({
  cartApi: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
  },
}));

vi.mock('./pages', () => ({
  Home: () => <section>Featured PLASHOE storefront</section>,
  Men: () => <section>Men page</section>,
  Women: () => <section>Women page</section>,
  Collection: () => <section>Collection page</section>,
  Sale: () => <section>Sale page</section>,
  Cart: () => <section>Cart page</section>,
  Checkout: () => <section>Checkout page</section>,
  CheckoutReturn: () => <section>Checkout return page</section>,
  Account: () => <section>Account page</section>,
  Contact: () => <section>Contact page</section>,
  LookBook: () => <section>Lookbook page</section>,
  OurStory: () => <section>Our story page</section>,
  OrderDetail: () => <section>Order detail page</section>,
}));

test('renders the PLASHOE storefront shell', () => {
  render(<App />);

  expect(screen.getByAltText(/plashoe/i)).toBeInTheDocument();
  expect(screen.getByText(/free express shipping/i)).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /^men$/i }).length).toBeGreaterThan(0);
  expect(screen.getByText(/featured plashoe storefront/i)).toBeInTheDocument();
});
