import axiosInstance from "./axiosintercepter";

export const getCountry = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/countries`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getCountryById = async (id) => {
  try {
    const response = await axiosInstance.get(`/master-data/countries/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const createCountry = async (data) => {
  try {
    const response = await axiosInstance.post(`/master-data/countries`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateCountry = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/master-data/countries/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteCountry = async (id) => {
  try {
    const response = await axiosInstance.delete(`/master-data/countries/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
