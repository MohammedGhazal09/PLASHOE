import { vi } from 'vitest';
import { act } from '@testing-library/react';
import { cartApi } from '../api/cartApi';
import { useAuthStore } from './authStore';
import {
  normalizeCartItem,
  selectItemCount,
  selectSubtotal,
  selectTotal,
  useCartStore,
} from './cartStore';

vi.mock('../api/cartApi', () => ({
  cartApi: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    mergeItems: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
  },
}));

vi.mock('../api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    addAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}));

const resetStores = () => {
  localStorage.clear();
  vi.clearAllMocks();
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
    original: 120,
    current: 100,
  },
};

const backendProduct = {
  _id: '64f000000000000000000001',
  name: 'Backend Merge Runner',
  image: '/backend-runner.jpg',
  price: {
    original: 150,
    current: 125,
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

test('normalizes backend cart sync items into one view model', async () => {
  useAuthStore.setState({ isAuthenticated: true, token: 'token' });
  cartApi.getCart.mockResolvedValue({
    success: true,
    data: {
      items: [
        {
          _id: 'cart-item-1',
          product: {
            _id: 'product-1',
            name: 'Backend Runner',
            image: '/runner.jpg',
            price: { original: 150, current: 125 },
          },
          quantity: 2,
          size: 43,
          priceAtAdd: 110,
        },
      ],
      couponCode: 'SAVE10',
      discount: 10,
    },
  });

  await act(async () => {
    await useCartStore.getState().syncCart();
  });

  expect(useCartStore.getState().items[0]).toMatchObject({
    id: 'cart-item-1',
    cartItemId: 'cart-item-1',
    productId: 'product-1',
    name: 'Backend Runner',
    image: '/runner.jpg',
    size: 43,
    quantity: 2,
    unitPrice: 110,
    originalPrice: 150,
    lineTotal: 220,
    source: 'backend',
  });
  expect(useCartStore.getState()).toMatchObject({
    couponCode: 'SAVE10',
    discount: 10,
    isLoading: false,
  });
});

test('accumulates duplicate guest product and size quantities without API calls', async () => {
  await act(async () => {
    await useCartStore.getState().addItem(product, 1, 42);
    await useCartStore.getState().addItem(product, 2, 42);
  });

  const state = useCartStore.getState();

  expect(state.items).toHaveLength(1);
  expect(state.items[0]).toMatchObject({
    productId: product._id,
    name: product.name,
    image: product.image,
    quantity: 3,
    size: 42,
    unitPrice: 100,
    originalPrice: 120,
    lineTotal: 300,
    source: 'local',
  });
  expect(cartApi.addItem).not.toHaveBeenCalled();
});

test('merges backend-syncable guest cart items after authentication', async () => {
  useAuthStore.setState({ isAuthenticated: true, token: 'token' });
  useCartStore.setState({
    items: [
      normalizeCartItem({
        _id: 'local-merge-1',
        product: backendProduct,
        quantity: 2,
        size: 42,
        priceAtAdd: 100,
        source: 'local',
      }),
    ],
  });
  cartApi.mergeItems.mockResolvedValue({
    success: true,
    data: {
      items: [
        {
          _id: 'cart-item-1',
          product: backendProduct,
          quantity: 2,
          size: 42,
          priceAtAdd: 125,
        },
      ],
      couponCode: null,
      discount: 0,
    },
  });

  let result;
  await act(async () => {
    result = await useCartStore.getState().mergeLocalCart();
  });

  expect(cartApi.mergeItems).toHaveBeenCalledWith([
    { productId: backendProduct._id, quantity: 2, size: 42 },
  ]);
  expect(result).toMatchObject({ success: true, merged: 1, localOnly: 0 });
  expect(useCartStore.getState().items[0]).toMatchObject({
    id: 'cart-item-1',
    cartItemId: 'cart-item-1',
    productId: backendProduct._id,
    quantity: 2,
    unitPrice: 125,
    source: 'backend',
  });
});

test('keeps local-only cart items for review after authentication', async () => {
  useAuthStore.setState({ isAuthenticated: true, token: 'token' });
  useCartStore.setState({
    items: [
      normalizeCartItem({
        _id: 'local-only-1',
        product,
        quantity: 1,
        size: 42,
        priceAtAdd: 100,
        source: 'local',
      }),
    ],
  });

  let result;
  await act(async () => {
    result = await useCartStore.getState().mergeLocalCart();
  });

  expect(cartApi.mergeItems).not.toHaveBeenCalled();
  expect(result).toMatchObject({ success: false, merged: 0, localOnly: 1 });
  expect(useCartStore.getState().items[0]).toMatchObject({
    productId: product._id,
    source: 'local',
  });
});

test('preserves guest cart items when merge returns a checkout conflict', async () => {
  useAuthStore.setState({ isAuthenticated: true, token: 'token' });
  useCartStore.setState({
    items: [
      normalizeCartItem({
        _id: 'local-conflict-1',
        product: backendProduct,
        quantity: 4,
        size: 42,
        priceAtAdd: 100,
        source: 'local',
      }),
    ],
  });
  cartApi.mergeItems.mockRejectedValue({
    response: {
      data: {
        message: 'Some cart items need review before checkout',
        errors: [{ code: 'INSUFFICIENT_STOCK' }],
      },
    },
  });

  let result;
  await act(async () => {
    result = await useCartStore.getState().mergeLocalCart();
  });

  expect(result).toMatchObject({
    success: false,
    message: 'Some cart items need review before checkout',
    localOnly: 1,
  });
  expect(useCartStore.getState()).toMatchObject({
    error: 'Some cart items need review before checkout',
  });
  expect(useCartStore.getState().items[0]).toMatchObject({
    productId: backendProduct._id,
    quantity: 4,
    source: 'local',
  });
});

test('updates and removes guest cart items locally', async () => {
  await act(async () => {
    await useCartStore.getState().addItem(product, 1, 42);
  });

  const itemId = useCartStore.getState().items[0].id;

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

test('migrates older persisted guest cart shapes instead of wiping them', async () => {
  localStorage.setItem(
    'cart-storage',
    JSON.stringify({
      state: {
        items: [{ _id: 'local-old-1', product, quantity: 2, size: 41 }],
        couponCode: 'OLD20',
        discount: 20,
      },
      version: 0,
    })
  );

  await act(async () => {
    await useCartStore.persist.rehydrate();
  });

  expect(useCartStore.getState().items[0]).toMatchObject({
    id: 'local-old-1',
    productId: product._id,
    name: product.name,
    unitPrice: 100,
    originalPrice: 120,
    lineTotal: 200,
    source: 'local',
  });
  expect(useCartStore.getState()).toMatchObject({
    couponCode: 'OLD20',
    discount: 20,
  });
});

test('normalizes legacy item shapes directly', () => {
  expect(
    normalizeCartItem({
      _id: 'cart-item-1',
      product,
      quantity: 2,
      size: 42,
      priceAtAdd: 90,
    })
  ).toMatchObject({
    id: 'cart-item-1',
    cartItemId: 'cart-item-1',
    productId: product._id,
    name: product.name,
    unitPrice: 90,
    originalPrice: 120,
    lineTotal: 180,
  });
});

test('rehydrates current persisted cart items with normalized original prices', async () => {
  localStorage.setItem(
    'cart-storage',
    JSON.stringify({
      state: {
        items: [
          {
            id: 'local-sale-1',
            productId: product._id,
            name: product.name,
            image: product.image,
            size: 41,
            quantity: 2,
            unitPrice: 80,
            originalPrice: 120,
            lineTotal: 160,
            source: 'local',
          },
        ],
        couponCode: null,
        discount: 0,
      },
      version: 1,
    })
  );

  await act(async () => {
    await useCartStore.persist.rehydrate();
  });

  expect(useCartStore.getState().items[0]).toMatchObject({
    productId: product._id,
    unitPrice: 80,
    originalPrice: 120,
    lineTotal: 160,
    source: 'local',
  });
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
