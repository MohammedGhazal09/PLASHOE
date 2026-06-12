import { act } from '@testing-library/react';
import { cartApi } from '../api/cartApi';
import { useAuthStore } from './authStore';
import {
  selectItemCount,
  selectSubtotal,
  selectTotal,
  useCartStore,
} from './cartStore';

jest.mock('../api/cartApi', () => ({
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

const resetStores = () => {
  localStorage.clear();
  jest.clearAllMocks();
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  useCartStore.setState({
    items: [],
    couponCode: null,
    discount: 0,
    isLoading: false,
    error: null,
    isCartOpen: false,
  });
};

const product = {
  _id: 'local-shoe-1',
  name: 'PLASHOE Runner',
  image: '/shoe.jpg',
  price: {
    current: 100,
  },
};

beforeEach(resetStores);

test('computes item count, subtotal, and discounted total', () => {
  useCartStore.setState({
    items: [
      { _id: 'item-1', product, quantity: 2, size: 42 },
      {
        _id: 'item-2',
        product: { ...product, _id: 'local-shoe-2', price: { current: 80 } },
        quantity: 1,
        size: 41,
      },
    ],
    couponCode: 'SAVE20',
    discount: 20,
  });

  const state = useCartStore.getState();

  expect(selectItemCount(state)).toBe(3);
  expect(selectSubtotal(state)).toBe(280);
  expect(selectTotal(state)).toBe(224);
});

test('accumulates duplicate guest product and size quantities without API calls', async () => {
  await act(async () => {
    await useCartStore.getState().addItem(product, 1, 42);
    await useCartStore.getState().addItem(product, 2, 42);
  });

  const state = useCartStore.getState();

  expect(state.items).toHaveLength(1);
  expect(state.items[0]).toMatchObject({
    product,
    quantity: 3,
    size: 42,
    priceAtAdd: 100,
  });
  expect(cartApi.addItem).not.toHaveBeenCalled();
});

test('updates and removes guest cart items locally', async () => {
  await act(async () => {
    await useCartStore.getState().addItem(product, 1, 42);
  });

  const itemId = useCartStore.getState().items[0]._id;

  await act(async () => {
    await useCartStore.getState().updateItemQuantity(itemId, 4);
  });

  expect(useCartStore.getState().items[0].quantity).toBe(4);

  await act(async () => {
    await useCartStore.getState().removeItem(itemId);
  });

  expect(useCartStore.getState().items).toEqual([]);
  expect(cartApi.updateItem).not.toHaveBeenCalled();
  expect(cartApi.removeItem).not.toHaveBeenCalled();
});

test('clearCart resets items, coupon code, and discount', async () => {
  useCartStore.setState({
    items: [{ _id: 'item-1', product, quantity: 1, size: 42 }],
    couponCode: 'SAVE20',
    discount: 20,
  });

  await act(async () => {
    await useCartStore.getState().clearCart();
  });

  expect(useCartStore.getState()).toMatchObject({
    items: [],
    couponCode: null,
    discount: 0,
  });
  expect(cartApi.clearCart).not.toHaveBeenCalled();
});
