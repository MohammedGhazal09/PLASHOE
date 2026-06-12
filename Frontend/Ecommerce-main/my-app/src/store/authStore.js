import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authApi } from '../api/authApi';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Register
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(name, email, password);
          if (response.success) {
            set({
              user: response.data,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          if (response.success) {
            set({
              user: response.data,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Get current user
      fetchUser: async () => {
        if (!get().token) return;
        set({ isLoading: true });
        try {
          const response = await authApi.getMe();
          if (response.success) {
            set({ user: response.data, isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          get().logout();
        }
      },

      // Update profile
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.updateProfile(profileData);
          if (response.success) {
            set({ user: response.data, isLoading: false });
            return { success: true };
          }
        } catch (error) {
          const message = error.response?.data?.message || 'Update failed';
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
