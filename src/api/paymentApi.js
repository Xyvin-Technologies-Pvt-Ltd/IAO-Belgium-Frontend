import axiosInstance from "./axiosintercepter";

export const getPayments = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByCity = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/city`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByProgram = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/program`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByBatch = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/batch`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};