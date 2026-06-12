import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '../api/cartApi';
import { useAuthStore } from './authStore';

// External selectors for computed values (more performant than getters)
export const selectItemCount = (state) =>
  state.items.reduce((acc, item) => acc + item.quantity, 0);

export const selectSubtotal = (state) =>
  state.items.reduce((acc, item) => {
    const price = item.product?.price?.current || item.priceAtAdd || 0;
    return acc + price * item.quantity;
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
              items: response.data.items || [],
              couponCode: response.data.couponCode || null,
              discount: response.data.discount || 0,
              isLoading: false,
            });
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
                items: response.data.items || [],
                isLoading: false,
              });
              return { success: true };
            }
          } catch (error) {
            set({ isLoading: false });
            return { success: false, message: error.response?.data?.message };
          }
        } else {
          // Local cart for guests
          const items = get().items;
          const existingIndex = items.findIndex(
            (item) => item.product?._id === product._id && item.size === size
          );

          if (existingIndex > -1) {
            const newItems = [...items];
            newItems[existingIndex].quantity += quantity;
            set({ items: newItems });
          } else {
            set({
              items: [...items, {
                _id: `local-${Date.now()}`,
                product,
                quantity,
                size,
                priceAtAdd: product.price.current,
              }],
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
                items: response.data.items || [],
                isLoading: false,
              });
            }
          } catch (error) {
            set({ isLoading: false });
          }
        } else {
          const items = get().items.map((item) =>
            item._id === itemId ? { ...item, quantity } : item
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
                items: response.data.items || [],
                isLoading: false,
              });
            }
          } catch (error) {
            set({ isLoading: false });
          }
        } else {
          const items = get().items.filter((item) => item._id !== itemId);
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
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discount: state.discount,
      }),
    }
  )
);
