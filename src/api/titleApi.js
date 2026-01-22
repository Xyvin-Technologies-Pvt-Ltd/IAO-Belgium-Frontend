import axiosInstance from "./axiosintercepter";

export const getTitles = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/teacher-title`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createTitle = async (data) => {
  try {
    const response = await axiosInstance.post(`/master-data/teacher-title`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateTitle = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/master-data/teacher-title/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteTitle = async (id) => {
  try {
    const response = await axiosInstance.delete(`/master-data/teacher-title/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
