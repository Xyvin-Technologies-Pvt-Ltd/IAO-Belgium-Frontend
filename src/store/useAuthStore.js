import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as loginApi, refreshToken as refreshTokenApi } from "../api/authApi";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await loginApi(credentials);
          const { accessToken, refreshToken, expiresIn } = response.data;
          const role = response?.data?.user?.role;

          set({
            token: accessToken,
            refreshToken,
            role,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response;
        } catch (error) {
          set({
            token: null,
            refreshToken: null,
            role: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || "Login failed",
          });
          throw error;
        }
      },

      logout: () => {
        set({
          token: null,
          refreshToken: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      updateTokens: (token, refreshToken) => {
        set({ token, refreshToken, isAuthenticated: !!token });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        set({ isLoading: true, error: null });

        try {
          const response = await refreshTokenApi({ refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          set({
            token: accessToken,
            refreshToken: newRefreshToken || refreshToken, // Use new refresh token if provided, otherwise keep existing
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response;
        } catch (error) {
          // If refresh fails, logout the user
          set({
            token: null,
            refreshToken: null,
            role: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || "Token refresh failed",
          });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
