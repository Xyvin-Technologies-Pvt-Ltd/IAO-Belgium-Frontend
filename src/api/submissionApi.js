import axiosInstance from "./axiosintercepter";

export const getSubmissions = async (filter) => {
  try {
    const response = await axiosInstance.get(`/submission`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const bulkAssignTeacher = async (payload) => {
  try {
    const response = await axiosInstance.put(`/submission/bulk-assign-teacher`, payload);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getTeacherSubmissions = async (filter) => {
  try {
    const response = await axiosInstance.get(`/submission/teacher`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const evaluateSubmission = async (id, payload) => {
  try {
    const response = await axiosInstance.put(`/submission/${id}/evaluate`, payload);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getSubmissionById = async (id) => {
  try {
    const response = await axiosInstance.get(`/submission/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

