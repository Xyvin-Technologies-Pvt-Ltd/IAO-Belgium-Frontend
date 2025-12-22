import axios from "axios";
const baseURL = import.meta.env.VITE_APP_AWS_API_URL;
const apiKey = import.meta.env.VITE_APP_API_KEY;
const axiosInstance = axios.create({
  baseURL: baseURL,
});
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("4ZbFyedjehdkjkhj");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers["x-api-key"] = apiKey;
    }
    config.headers["ngrok-skip-browser-warning"] = "true";
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
