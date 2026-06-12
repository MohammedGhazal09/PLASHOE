import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./api/authApi', () => ({
  authApi: {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
    updateProfile: jest.fn(),
    addAddress: jest.fn(),
    deleteAddress: jest.fn(),
  },
}));

jest.mock('./api/cartApi', () => ({
  cartApi: {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    applyCoupon: jest.fn(),
    removeCoupon: jest.fn(),
  },
}));

jest.mock('./pages', () => ({
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
