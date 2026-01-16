import axiosInstance from "./axiosintercepter";

export const getIntakes = async (filter) => {
  try {
    const response = await axiosInstance.get(`/intake`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createIntake = async (data) => {
  try {
    const response = await axiosInstance.post(`/intake`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateintake = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/intake/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteIntake = async (id) => {
  try {
    const response = await axiosInstance.delete(`/intake/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
