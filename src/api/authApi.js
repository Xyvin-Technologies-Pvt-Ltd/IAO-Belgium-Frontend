import axiosInstance from "./axiosintercepter";

export const sendOtp = async (data) => {
  try {
    const response = await axiosInstance.post(`/auth/send-otp`, data, {
      skipAuthRefresh: true
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const verifyOtp = async (data) => {
  try {
    const response = await axiosInstance.post(`/auth/verify-otp`, data, {
      skipAuthRefresh: true
    });
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

export const refreshToken = async () => {
  try {
    const response = await axiosInstance.post(`/auth/refresh`, {}, {
      skipAuthRefresh: true
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const logout = async () => {
  try {
    const response = await axiosInstance.post(`/auth/logout`, {}, {
      skipAuthRefresh: true
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};