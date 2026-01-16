import axiosInstance from "./axiosintercepter";

export const getCountry = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/country`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createCountry = async (data) => {
  try {
    const response = await axiosInstance.post(`/master-data/country`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateCountry = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/master-data/country/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteCountry = async (id) => {
  try {
    const response = await axiosInstance.delete(`/master-data/country/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
