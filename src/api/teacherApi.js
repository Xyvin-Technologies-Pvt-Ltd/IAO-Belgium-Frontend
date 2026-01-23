import axiosInstance from "./axiosintercepter";

export const getTeacher = async (filter) => {
  try {
    const response = await axiosInstance.get(`/user/teacher`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getTeacherById = async (id) => {
  try {
    const response = await axiosInstance.get(`/user/teacher/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
export const createTeacher = async (data) => {
  try {
    const response = await axiosInstance.post(`/user/teacher`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateTeacher = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/user/teacher/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteTeacher = async (id) => {
  try {
    const response = await axiosInstance.delete(`/user/teacher/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
