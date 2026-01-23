import axiosInstance from "./axiosintercepter";

export const createComponent = async (data) => {
  try {
    const response = await axiosInstance.post(`/components`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getComponents = async (filter) => {
  try {
    const response = await axiosInstance.get(`/components`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateComponent = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/components/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
