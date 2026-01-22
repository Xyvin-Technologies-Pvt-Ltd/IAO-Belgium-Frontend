import axiosInstance from "./axiosintercepter";

export const getTeacherRole = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/teacher-role`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createTeacherRole = async (data) => {
  try {
    const response = await axiosInstance.post(`/master-data/teacher-role`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateTeacherRole = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/master-data/teacher-role/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteTeacherRole = async (id) => {
  try {
    const response = await axiosInstance.delete(`/master-data/teacher-role/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
