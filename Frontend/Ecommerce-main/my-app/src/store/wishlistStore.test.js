import { act } from '@testing-library/react';
import { vi } from 'vitest';
import { wishlistApi } from '../api/wishlistApi';
import { useAuthStore } from './authStore';
import {
  isBackendWishlistProductId,
  normalizeWishlistItem,
  selectWishlistCount,
  useWishlistStore,
} from './wishlistStore';

vi.mock('../api/wishlistApi', () => ({
  wishlistApi: {
    getWishlist: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('../api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

const backendProductId = '64f1a2b3c4d5e6f789abcd12';
const secondBackendProductId = '64f1a2b3c4d5e6f789abcd34';

const product = {
  id: backendProductId,
  name: 'Backend Runner',
  image: '/runner.jpg',
  price: { current: 100, original: 120 },
  sizes: [41, 42],
  stock: 7,
  category: 'Running',
  gender: 'male',
};

const localProduct = {
  id: 'local-male-0',
  name: 'Local Runner',
  image: '/local.jpg',
  price: { current: 80, original: 90 },
  sizes: [40],
  stock: 3,
};

const apiWishlistResponse = (items) => ({
  success: true,
  data: items.map((item) => ({
    productId: item.productId || item._id || item.id,
    addedAt: item.addedAt || '2026-06-20T00:00:00.000Z',
    product: {
      _id: item.productId || item._id || item.id,
      name: item.name || 'Backend Runner',
      image: item.image || '/runner.jpg',
      price: item.price || { current: 100, original: 120 },
      sizes: item.sizes || [41, 42],
      stock: item.stock ?? 7,
      category: item.category || 'Running',
      gender: item.gender || 'male',
      isOnSale: item.isOnSale || false,
    },
  })),
});

const resetStores = () => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  useWishlistStore.setState({
    items: [],
    isLoading: false,
    error: null,
    lastMessage: null,
  });
};

beforeEach(resetStores);

test('detects backend-safe wishlist product ids', () => {
  expect(isBackendWishlistProductId(backendProductId)).toBe(true);
  expect(isBackendWishlistProductId('local-male-0')).toBe(false);
  expect(isBackendWishlistProductId('not-an-id')).toBe(false);
});

test('normalizes wishlist products into the store item shape', () => {
  expect(normalizeWishlistItem(product)).toMatchObject({
    productId: backendProductId,
    name: 'Backend Runner',
    image: '/runner.jpg',
    price: { current: 100, original: 120 },
    sizes: [41, 42],
    stock: 7,
    category: 'Running',
    gender: 'male',
  });
});

test('saves and removes guest wishlist items locally without API calls', async () => {
  await act(async () => {
    await useWishlistStore.getState().addItem(product);
  });

  expect(useWishlistStore.getState().items).toHaveLength(1);
  expect(useWishlistStore.getState().isSaved(backendProductId)).toBe(true);
  expect(selectWishlistCount(useWishlistStore.getState())).toBe(1);
  expect(wishlistApi.addItem).not.toHaveBeenCalled();

  await act(async () => {
    await useWishlistStore.getState().removeItem(backendProductId);
  });

  expect(useWishlistStore.getState().items).toEqual([]);
  expect(wishlistApi.removeItem).not.toHaveBeenCalled();
});

test('syncs authenticated backend-safe saves through the wishlist API', async () => {
  useAuthStore.setState({ isAuthenticated: true, token: 'token' });
  wishlistApi.addItem.mockResolvedValue(apiWishlistResponse([product]));

  await act(async () => {
    await useWishlistStore.getState().addItem(product);
  });

  expect(wishlistApi.addItem).toHaveBeenCalledWith(backendProductId);
  expect(useWishlistStore.getState().items[0]).toMatchObject({
    productId: backendProductId,
    name: 'Backend Runner',
    source: 'backend',
  });
});

test('keeps authenticated local-only products local without API calls', async () => {
  useAuthStore.setState({ isAuthenticated: true, token: 'token' });

  const result = await act(async () => useWishlistStore.getState().addItem(localProduct));

  expect(result).toMatchObject({
    success: true,
    source: 'local',
  });
  expect(wishlistApi.addItem).not.toHaveBeenCalled();
  expect(useWishlistStore.getState().items[0]).toMatchObject({
    productId: 'local-male-0',
    source: 'local',
  });
});

test('merges backend-safe local wishlist items after authentication and keeps local-only items', async () => {
  await act(async () => {
    await useWishlistStore.getState().addItem(product);
    await useWishlistStore.getState().addItem(localProduct);
  });
  useAuthStore.setState({ isAuthenticated: true, token: 'token' });
  wishlistApi.addItem.mockResolvedValue(apiWishlistResponse([product]));
  wishlistApi.getWishlist.mockResolvedValue(
    apiWishlistResponse([
      product,
      { ...product, productId: secondBackendProductId, name: 'Existing Backend Shoe' },
    ])
  );

  const result = await act(async () => useWishlistStore.getState().mergeLocalWishlist());

  expect(result).toMatchObject({ success: true, merged: 1 });
  expect(wishlistApi.addItem).toHaveBeenCalledWith(backendProductId);
  expect(wishlistApi.getWishlist).toHaveBeenCalled();
  expect(useWishlistStore.getState().items.map((item) => item.productId)).toEqual([
    backendProductId,
    secondBackendProductId,
    'local-male-0',
  ]);
});

test('keeps local items available when authenticated merge fails', async () => {
  await act(async () => {
    await useWishlistStore.getState().addItem(product);
  });
  useAuthStore.setState({ isAuthenticated: true, token: 'token' });
  wishlistApi.addItem.mockRejectedValue(new Error('network'));

  const result = await act(async () => useWishlistStore.getState().mergeLocalWishlist());

  expect(result.success).toBe(false);
  expect(useWishlistStore.getState().items[0]).toMatchObject({
    productId: backendProductId,
    source: 'local',
  });
});
