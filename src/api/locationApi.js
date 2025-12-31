import axiosInstance from "./axiosintercepter";

export const getLocations = async (filter) => {
  try {
    const response = await axiosInstance.get(`/locations`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getLocationById = async (id) => {
  try {
    const response = await axiosInstance.get(`/locations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const createLocation = async (data) => {
  try {
    const response = await axiosInstance.post(`/locations`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateLocation = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/locations/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteLocation = async (id) => {
  try {
    const response = await axiosInstance.delete(`/locations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
