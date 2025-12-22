import axiosInstance from "./axiosintercepter";

export const getCourses = async (filter) => {
  try {
    const response = await axiosInstance.get(`/courses`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getCourseById = async (id) => {
  try {
    const response = await axiosInstance.get(`/courses/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const createCourse = async (data) => {
  try {
    const response = await axiosInstance.post(`/courses`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateCourse = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/courses/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteCourse = async (id) => {
  try {
    const response = await axiosInstance.delete(`/courses/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
