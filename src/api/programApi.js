import axiosInstance from "./axiosintercepter";

export const getPrograms = async (filter) => {
  try {
    const response = await axiosInstance.get(`/program`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getProgramById = async (id) => {
  try {
    const response = await axiosInstance.get(`/program/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
export const createProgram = async (data) => {
  try {
    const response = await axiosInstance.post(`/program`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateProgram = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/program/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const duplicateProgram = async (id) => {
  try {
    const response = await axiosInstance.patch(`/program/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteProgram = async (id) => {
  try {
    const response = await axiosInstance.delete(`/program/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
