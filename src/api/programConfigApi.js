import axiosInstance from "./axiosintercepter";

export const getProgramConfigs = async (filter) => {
  try {
    const response = await axiosInstance.get(`/program-config`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createProgramConfig = async (data) => {
  try {
    const response = await axiosInstance.post(`/program-config`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateProgramConfig = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/program-config/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteProgramConfig = async (id) => {
  try {
    const response = await axiosInstance.delete(`/program-config/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
