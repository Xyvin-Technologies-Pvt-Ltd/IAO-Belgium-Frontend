import axios from "axios";
import { toast } from "sonner";
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//* Single-flight refresh: when several requests 401 at once (e.g. a dashboard
//* firing many queries on an expired token), they must share ONE /auth/refresh
//* call. Otherwise parallel refreshes race and — with refresh-token rotation —
//* can revoke the just-issued token and log the user out spuriously.
let refreshPromise = null;

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = useAuthStore
      .getState()
      .refreshAccessToken()
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const skipAuthRefresh = originalRequest?.skipAuthRefresh;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !skipAuthRefresh &&
      useAuthStore.getState().isAuthenticated
    ) {
      originalRequest._retry = true;

      try {
        await refreshOnce();

        const newToken = useAuthStore.getState().token;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    //* 403 = authenticated but not authorized (e.g. teacher hitting an admin
    //* endpoint once backend RBAC is enforced). Surface it once; do not refresh.
    if (status === 403 && !originalRequest?.skipAuthRefresh) {
      const message =
        error.response?.data?.message ||
        "You do not have permission to perform this action.";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
