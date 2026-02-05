import axiosInstance from "./axiosintercepter";

export const getBatchById = async (id) => {
  try {
    const response = await axiosInstance.get(`/intake/batch/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getStudentByBatch = async (id) => {
  try {
    const response = await axiosInstance.get(`/intake/batch/students/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createBatch = async (data) => {
  try {
    const response = await axiosInstance.post(`/batch`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteBatch = async (id) => {
  try {
    const response = await axiosInstance.delete(`/batch/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
