import axios from "axios";

const baseURL = import.meta.env.VITE_APP_API_URL;
const apiKey = import.meta.env.VITE_APP_API_KEY;

const axiosInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

/** Lazy store access — avoids circular init with useAuthStore → authApi → axios */
const getAuthStore = async () => {
  const mod = await import("../store/useAuthStore");
  return mod.useAuthStore;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    config.headers["x-api-key"] = apiKey;
    const useAuthStore = await getAuthStore();
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const skipAuthRefresh = originalRequest.skipAuthRefresh;
    const useAuthStore = await getAuthStore();

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !skipAuthRefresh &&
      useAuthStore.getState().isAuthenticated
    ) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().refreshAccessToken();
        const newToken = useAuthStore.getState().token;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
