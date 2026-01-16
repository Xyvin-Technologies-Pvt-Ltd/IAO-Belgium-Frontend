import axiosInstance from "./axiosintercepter";

export const getCities = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/city`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createCity = async (data) => {
  try {
    const response = await axiosInstance.post(`/master-data/city`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateCity = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/master-data/city/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteCity = async (id) => {
  try {
    const response = await axiosInstance.delete(`/master-data/city/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
