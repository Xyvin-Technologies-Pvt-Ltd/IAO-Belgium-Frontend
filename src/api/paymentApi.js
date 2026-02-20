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