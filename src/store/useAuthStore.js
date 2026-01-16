import { create } from "zustand";
import { verifyOtp, refreshToken as refreshTokenApi, logout as logoutApi } from "../api/authApi";

export const useAuthStore = create((set, get) => ({
  token: null, 
  role: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,

  verifyOtp: async (email, otp) => {
    set({ isLoading: true, error: null });

    try {
      const response = await verifyOtp({ email, otp });
      const { access_token } = response.data;
      const role = response?.data?.user?.role;
      const user = response?.data?.user;

      set({
        token: access_token,
        role,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error) {
      set({
        token: null,
        role: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || "OTP verification failed",
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      set({
        token: null,
        role: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  updateToken: (token) => {
    set({ token, isAuthenticated: !!token });
  },

  refreshAccessToken: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await refreshTokenApi();
      const { access_token } = response.data;
      const role = response?.data?.user?.role;
      const user = response?.data?.user;

      set({
        token: access_token,
        role,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error) {
      set({
        token: null,
        role: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || "Token refresh failed",
      });
      throw error;
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      await get().refreshAccessToken();
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      set({ 
        isInitialized: true, 
        isLoading: false,
        isAuthenticated: false 
      });
    }
  },
}));
