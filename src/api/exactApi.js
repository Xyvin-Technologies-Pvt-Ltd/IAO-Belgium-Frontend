import axiosInstance from "./axiosintercepter";

export const getExactStatus = async () => {
  try {
    const response = await axiosInstance.get("/exact/status");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getExactUnsynced = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/exact/unsynced", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getExactSent = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/exact/sent", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const reconcileExact = async () => {
  try {
    const response = await axiosInstance.post("/exact/reconcile");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const disconnectExact = async () => {
  try {
    const response = await axiosInstance.delete("/exact/disconnect");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
