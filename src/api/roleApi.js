import axiosInstance from "./axiosintercepter";

export const getRoles = async (filter) => {
  try {
    const response = await axiosInstance.get(`/role`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createRole = async (data) => {
  try {
    const response = await axiosInstance.post(`/role`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateRole = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/role/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteRole = async (id) => {
  try {
    const response = await axiosInstance.delete(`/role/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
