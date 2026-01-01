import axiosInstance from "./axiosintercepter";

export const getRoles = async (filter) => {
  try {
    const response = await axiosInstance.get(`/roles`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getRoleById = async (id) => {
  try {
    const response = await axiosInstance.get(`/roles/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const createRole = async (data) => {
  try {
    const response = await axiosInstance.post(`/roles`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateRole = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/roles/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteRole = async (id) => {
  try {
    const response = await axiosInstance.delete(`/roles/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
