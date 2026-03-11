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

export const getBatchAttendance = async (batchId, params) => {
  try {
    const response = await axiosInstance.get(`/planning/batch/${batchId}/attendance`, { params });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getBatchExamResults = async (batchId, params) => {
  try {
    const response = await axiosInstance.get(`/exam/teacher/batch/${batchId}/results`, { params });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
