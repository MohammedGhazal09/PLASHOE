import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistApi } from '../api/wishlistApi';
import { useAuthStore } from './authStore';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const toId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const isBackendWishlistProductId = (productId) =>
  Boolean(productId && OBJECT_ID_PATTERN.test(String(productId)) && !String(productId).startsWith('local-'));

export const resolveWishlistProductId = (product = {}) =>
  toId(product.productId) ||
  toId(product.id) ||
  toId(product._id) ||
  toId(product.raw?._id) ||
  toId(product.product?._id) ||
  toId(product.product);

export const normalizeWishlistItem = (item = {}, { source } = {}) => {
  const product = item.product && typeof item.product === 'object' ? item.product : item;
  const productId = resolveWishlistProductId(item) || resolveWishlistProductId(product);
  const currentPrice = toNumber(
    item.price?.current ?? product.price?.current ?? item.price ?? product.price,
    0
  );
  const originalPrice = toNumber(item.price?.original ?? product.price?.original, currentPrice);

  return {
    productId,
    name: item.name || product.name || 'Product',
    image: item.image || product.image || '',
    price: {
      current: currentPrice,
      original: originalPrice,
    },
    sizes: Array.isArray(item.sizes) && item.sizes.length > 0
      ? item.sizes
      : Array.isArray(product.sizes)
        ? product.sizes
        : [],
    stock: toNumber(item.stock ?? product.stock, 0),
    category: item.category || product.category || '',
    gender: item.gender || product.gender || '',
    isOnSale: Boolean(item.isOnSale ?? product.isOnSale),
    addedAt: item.addedAt || new Date().toISOString(),
    source: source || item.source || (isBackendWishlistProductId(productId) ? 'backend' : 'local'),
    raw: item.raw || product,
  };
};

const normalizeWishlistResponse = (items = []) =>
  items.map((item) =>
    normalizeWishlistItem(
      {
        ...item.product,
        productId: item.productId || item.product?._id,
        addedAt: item.addedAt,
        raw: item.product || item,
      },
      { source: 'backend' }
    )
  );

const uniqueByProductId = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.productId || seen.has(item.productId)) {
      return false;
    }
    seen.add(item.productId);
    return true;
  });
};

const mergeBackendAndLocal = (backendItems, localItems) =>
  uniqueByProductId([
    ...backendItems,
    ...localItems.filter((item) => !backendItems.some((backend) => backend.productId === item.productId)),
  ]);

const serializeWishlistItem = ({ raw, ...item }) => item;

export const selectWishlistCount = (state) => state.items.length;

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      lastMessage: null,

      isSaved: (productOrId) => {
        const productId =
          typeof productOrId === 'string' ? productOrId : resolveWishlistProductId(productOrId);
        return get().items.some((item) => item.productId === productId);
      },

      syncWishlist: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) {
          return { success: true, skipped: true };
        }

        set({ isLoading: true, error: null });
        try {
          const response = await wishlistApi.getWishlist();
          const backendItems = response.success ? normalizeWishlistResponse(response.data || []) : [];
          const localItems = get().items.filter((item) => item.source === 'local');

          set({
            items: mergeBackendAndLocal(backendItems, localItems),
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to load wishlist';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      addItem: async (product) => {
        const item = normalizeWishlistItem(product, { source: 'local' });
        if (!item.productId) {
          return { success: false, message: 'Product cannot be saved' };
        }

        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const isBackendSyncable = isBackendWishlistProductId(item.productId);

        if (isAuthenticated && isBackendSyncable) {
          set({ isLoading: true, error: null });
          try {
            const response = await wishlistApi.addItem(item.productId);
            const backendItems = response.success ? normalizeWishlistResponse(response.data || []) : [];
            const localItems = get().items.filter(
              (localItem) =>
                localItem.source === 'local' &&
                (!isBackendWishlistProductId(localItem.productId) ||
                  localItem.productId !== item.productId)
            );

            set({
              items: mergeBackendAndLocal(backendItems, localItems),
              isLoading: false,
              error: null,
              lastMessage: 'Wishlist saved to your account.',
            });

            return { success: true, source: 'backend' };
          } catch (error) {
            const message = error.response?.data?.message || 'Failed to save item';
            set({ isLoading: false, error: message });
            return { success: false, message };
          }
        }

        const exists = get().items.some((existing) => existing.productId === item.productId);
        if (!exists) {
          set((state) => ({
            items: uniqueByProductId([...state.items, item]),
            lastMessage: isAuthenticated
              ? 'This item is saved on this device only.'
              : 'Saved on this device. Sign in to keep it across devices.',
          }));
        }

        return {
          success: true,
          source: 'local',
          message: isAuthenticated
            ? 'This item is saved on this device only.'
            : 'Saved on this device. Sign in to keep it across devices.',
        };
      },

      removeItem: async (productId) => {
        const normalizedProductId = resolveWishlistProductId({ productId });
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const isBackendSyncable = isBackendWishlistProductId(normalizedProductId);

        if (isAuthenticated && isBackendSyncable) {
          set({ isLoading: true, error: null });
          try {
            const response = await wishlistApi.removeItem(normalizedProductId);
            const backendItems = response.success ? normalizeWishlistResponse(response.data || []) : [];
            const localItems = get().items.filter(
              (item) => item.source === 'local' && item.productId !== normalizedProductId
            );

            set({
              items: mergeBackendAndLocal(backendItems, localItems),
              isLoading: false,
              error: null,
            });

            return { success: true };
          } catch (error) {
            const message = error.response?.data?.message || 'Failed to remove item';
            set({ isLoading: false, error: message });
            return { success: false, message };
          }
        }

        set((state) => ({
          items: state.items.filter((item) => item.productId !== normalizedProductId),
        }));

        return { success: true };
      },

      toggleWishlist: async (product) => {
        const productId = resolveWishlistProductId(product);
        if (get().isSaved(productId)) {
          return get().removeItem(productId);
        }

        return get().addItem(product);
      },

      mergeLocalWishlist: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) {
          return { success: false, message: 'Sign in to sync your wishlist.' };
        }

        const localItems = get().items.filter((item) => item.source === 'local');
        const backendSyncableItems = localItems.filter((item) =>
          isBackendWishlistProductId(item.productId)
        );
        const localOnlyItems = localItems.filter(
          (item) => !isBackendWishlistProductId(item.productId)
        );

        if (backendSyncableItems.length === 0) {
          const syncResult = await get().syncWishlist();
          return {
            ...syncResult,
            merged: 0,
            message: 'Wishlist saved to your account.',
          };
        }

        set({ isLoading: true, error: null });
        try {
          for (const item of backendSyncableItems) {
            await wishlistApi.addItem(item.productId);
          }

          const response = await wishlistApi.getWishlist();
          const backendItems = response.success ? normalizeWishlistResponse(response.data || []) : [];

          set({
            items: mergeBackendAndLocal(backendItems, localOnlyItems),
            isLoading: false,
            error: null,
            lastMessage: 'Wishlist saved to your account.',
          });

          return {
            success: true,
            merged: backendSyncableItems.length,
            message: 'Wishlist saved to your account.',
          };
        } catch (error) {
          const message =
            error.response?.data?.message ||
            'We could not sync your saved items. They are still saved on this device.';
          set({ isLoading: false, error: message, lastMessage: message });
          return { success: false, message };
        }
      },

      clearLocalWishlist: () => set({ items: [], error: null, lastMessage: null }),
    }),
    {
      name: 'wishlist-storage',
      version: 1,
      partialize: (state) => ({
        items: state.items.map(serializeWishlistItem),
      }),
    }
  )
);

