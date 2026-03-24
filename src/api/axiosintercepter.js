import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const baseURL = import.meta.env.VITE_APP_API_URL;
const apiKey = import.meta.env.VITE_APP_API_KEY;

const axiosInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true, 
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers["x-api-key"] = apiKey;

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 4. Log request config for multipart requests
    if (config.data instanceof FormData) {
      console.log("[interceptor] 📦 Request is FormData — Content-Type will be set by browser");
      console.log("[interceptor] FormData entries:");
      for (const [key, value] of config.data.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File { name: "${value.name}", size: ${value.size}, type: "${value.type}" }`);
          if (value.size === 0) {
            console.warn(`  ⚠️ File "${value.name}" has size 0 — this will cause an empty upload`);
          }
        } else {
          console.log(`  ${key}:`, value);
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const skipAuthRefresh = originalRequest.skipAuthRefresh;

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
