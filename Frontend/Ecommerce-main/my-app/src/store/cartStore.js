import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '../api/cartApi';
import { useAuthStore } from './authStore';

const toId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const normalizeCartItem = (item = {}) => {
  const rawProduct = item.product && typeof item.product === 'object' ? item.product : null;
  const productId =
    item.productId || toId(rawProduct) || (typeof item.product === 'string' ? item.product : null);
  const rawId = item.id || item._id || item.cartItemId;
  const cartItemId =
    item.cartItemId || (rawId && !String(rawId).startsWith('local-') ? String(rawId) : null);
  const id = String(rawId || cartItemId || `local-${productId || 'item'}-${item.size || 'any'}`);
  const quantity = toNumber(item.quantity, 1);
  const unitPrice = toNumber(
    item.unitPrice ??
      item.priceAtAdd ??
      (typeof item.price === 'number' ? item.price : undefined) ??
      item.price?.current ??
      rawProduct?.price?.current,
    0
  );

  return {
    id,
    cartItemId,
    productId,
    name: item.name || rawProduct?.name || 'Product',
    image: item.image || rawProduct?.image || '',
    size: item.size || 'N/A',
    quantity,
    unitPrice,
    lineTotal: unitPrice * quantity,
    source: item.source || (cartItemId ? 'backend' : 'local'),
    raw: item.raw || item,
  };
};

const normalizeCartItems = (items = []) => items.map(normalizeCartItem);

const mutationIdFor = (item) => item.cartItemId || item.id || item._id;

const serializeCartItem = ({ raw, ...item }) => item;

// External selectors for computed values (more performant than getters)
export const selectItemCount = (state) =>
  state.items.reduce((acc, item) => acc + item.quantity, 0);

export const selectSubtotal = (state) =>
  state.items.reduce((acc, item) => {
    const normalized = normalizeCartItem(item);
    return acc + normalized.lineTotal;
  }, 0);

export const selectTotal = (state) => {
  const subtotal = selectSubtotal(state);
  return subtotal - (subtotal * state.discount / 100);
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,
      isLoading: false,
      error: null,
      isCartOpen: false,

      // Toggle cart sidebar
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      // Sync with backend (for authenticated users)
      syncCart: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) return;

        set({ isLoading: true });
        try {
          const response = await cartApi.getCart();
          if (response.success) {
            set({
              items: normalizeCartItems(response.data.items || []),
              couponCode: response.data.couponCode || null,
              discount: response.data.discount || 0,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },

      // Add item to cart
      addItem: async (product, quantity = 1, size) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const isLocalProduct = product._id && product._id.startsWith('local-');

        if (isAuthenticated && !isLocalProduct) {
          set({ isLoading: true });
          try {
            const response = await cartApi.addItem(product._id, quantity, size);
            if (response.success) {
              set({
                items: normalizeCartItems(response.data.items || []),
                isLoading: false,
              });
              return { success: true };
            }
            set({ isLoading: false });
            return { success: false, message: response.message };
          } catch (error) {
            set({ isLoading: false });
            return { success: false, message: error.response?.data?.message };
          }
        } else {
          // Local cart for guests
          const items = get().items;
          const existingIndex = items.findIndex((item) => {
            const normalized = normalizeCartItem(item);
            return normalized.productId === product._id && normalized.size === size;
          });

          if (existingIndex > -1) {
            const newItems = [...items];
            newItems[existingIndex] = normalizeCartItem({
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            });
            set({ items: newItems });
          } else {
            set({
              items: [
                ...items,
                normalizeCartItem({
                  _id: `local-${Date.now()}`,
                  product,
                  quantity,
                  size,
                  priceAtAdd: product.price.current,
                  source: 'local',
                }),
              ],
            });
          }
          return { success: true };
        }
      },

      // Update item quantity
      updateItemQuantity: async (itemId, quantity) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const isLocalItem = itemId && itemId.startsWith('local-');

        if (quantity < 1) {
          return get().removeItem(itemId);
        }

        if (isAuthenticated && !isLocalItem) {
          set({ isLoading: true });
          try {
            const response = await cartApi.updateItem(itemId, quantity);
            if (response.success) {
              set({
                items: normalizeCartItems(response.data.items || []),
                isLoading: false,
              });
            } else {
              set({ isLoading: false });
            }
          } catch (error) {
            set({ isLoading: false });
          }
        } else {
          const items = get().items.map((item) =>
            mutationIdFor(item) === itemId ? normalizeCartItem({ ...item, quantity }) : item
          );
          set({ items });
        }
      },

      // Alias for updateItemQuantity
      updateQuantity: (itemId, quantity) => get().updateItemQuantity(itemId, quantity),

      // Remove item
      removeItem: async (itemId) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const isLocalItem = itemId && itemId.startsWith('local-');

        if (isAuthenticated && !isLocalItem) {
          set({ isLoading: true });
          try {
            const response = await cartApi.removeItem(itemId);
            if (response.success) {
              set({
                items: normalizeCartItems(response.data.items || []),
                isLoading: false,
              });
            } else {
              set({ isLoading: false });
            }
          } catch (error) {
            set({ isLoading: false });
          }
        } else {
          const items = get().items.filter((item) => mutationIdFor(item) !== itemId);
          set({ items });
        }
      },

      // Clear cart
      clearCart: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        if (isAuthenticated) {
          try {
            await cartApi.clearCart();
          } catch (error) {
            console.error('Failed to clear cart:', error);
          }
        }
        set({ items: [], couponCode: null, discount: 0 });
      },

      // Apply coupon
      applyCoupon: async (code) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        if (isAuthenticated) {
          set({ isLoading: true, error: null });
          try {
            const response = await cartApi.applyCoupon(code);
            if (response.success) {
              const couponCode = response.data?.couponCode;
              const discount = response.data?.discount;

              if (typeof discount !== 'number' || Number.isNaN(discount)) {
                const message = 'Coupon response did not include a valid discount';
                set({ error: message, isLoading: false });
                return { success: false, message };
              }

              set({
                couponCode,
                discount,
                error: null,
                isLoading: false,
              });
              return { success: true, message: response.message, discount, couponCode };
            }

            const message = response.message || 'Invalid coupon';
            set({ error: message, isLoading: false });
            return { success: false, message };
          } catch (error) {
            const message = error.response?.data?.message || 'Invalid coupon';
            set({ error: message, isLoading: false });
            return { success: false, message };
          }
        } else {
          // For guests, just validate the coupon format
          // In a real app, you'd call the validate endpoint
          return { success: false, message: 'Please login to apply coupon' };
        }
      },

      // Remove coupon
      removeCoupon: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        if (isAuthenticated) {
          try {
            await cartApi.removeCoupon();
          } catch (error) {
            console.error('Failed to remove coupon:', error);
          }
        }
        set({ couponCode: null, discount: 0 });
      },
    }),
    {
      name: 'cart-storage',
      version: 1,
      migrate: (persistedState) => ({
        ...persistedState,
        items: normalizeCartItems(persistedState?.items || []),
      }),
      partialize: (state) => ({
        items: state.items.map(serializeCartItem),
        couponCode: state.couponCode,
        discount: state.discount,
      }),
    }
  )
);
