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

export const getAnalyticsByBatchList = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/batch/list`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByStudent = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/student`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getInvoiceHtml = async (id) => {
  try {
    const response = await axiosInstance.get(`/payment/invoice/${id}`, { responseType: "text" });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createPayment = async (data) => {
  try {
    const response = await axiosInstance.post(`/payment`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};