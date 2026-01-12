import axiosInstance from "./axiosintercepter";

export const login = async (data) => {
  try {
    const response = await axiosInstance.post(`/auth/login`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getProfile = async () => {
  try {
    const response = await axiosInstance.get(`/auth/me`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const refreshToken = async (data) => {
  try {
    const response = await axiosInstance.post(`/auth/refresh`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};