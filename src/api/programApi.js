import axiosInstance from "./axiosintercepter";

export const getPrograms = async (filter) => {
  try {
    const response = await axiosInstance.get(`/catalog/programs`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getProgramById = async (id) => {
  try {
    const response = await axiosInstance.get(`/catalog/programs/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const createProgram = async (data) => {
  try {
    const response = await axiosInstance.post(`/catalog/programs`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateProgram = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/catalog/programs/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteProgram = async (id) => {
  try {
    const response = await axiosInstance.delete(`/catalog/programs/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
