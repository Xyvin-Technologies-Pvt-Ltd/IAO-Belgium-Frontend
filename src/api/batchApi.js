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
