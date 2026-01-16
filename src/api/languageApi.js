import axiosInstance from "./axiosintercepter";

export const getLanguages = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/language`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createLanguage = async (data) => {
  try {
    const response = await axiosInstance.post(`/master-data/language`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateLanguage = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/master-data/language/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteLanguage = async (id) => {
  try {
    const response = await axiosInstance.delete(`/master-data/language/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
