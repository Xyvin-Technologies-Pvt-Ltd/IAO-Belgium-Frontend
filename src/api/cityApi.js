import axiosInstance from "./axiosintercepter";

export const getCities = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/cities`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getCityById = async (id) => {
  try {
    const response = await axiosInstance.get(`/master-data/cities/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const createCity = async (data) => {
  try {
    const response = await axiosInstance.post(`/master-data/cities`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateCity = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/master-data/cities/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteCity = async (id) => {
  try {
    const response = await axiosInstance.delete(`/master-data/cities/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
