import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const baseURL = import.meta.env.VITE_APP_API_URL;
const apiKey = import.meta.env.VITE_APP_API_KEY;

const axiosInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Enable sending cookies with requests
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Always set the API key for every request
    config.headers["x-api-key"] = apiKey;
    
    // Set authorization token if available
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // config.headers["ngrok-skip-browser-warning"] = "true";
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

    // Check if this request should skip token refresh (set in individual API calls)
    const skipAuthRefresh = originalRequest.skipAuthRefresh;

    // Only attempt token refresh if:
    // 1. Response is 401 (Unauthorized)
    // 2. Request hasn't been retried yet
    // 3. Request doesn't have skipAuthRefresh flag
    // 4. User is currently authenticated
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !skipAuthRefresh &&
      useAuthStore.getState().isAuthenticated
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await useAuthStore.getState().refreshAccessToken();

        // Retry the original request with the new token
        const newToken = useAuthStore.getState().token;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout the user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
