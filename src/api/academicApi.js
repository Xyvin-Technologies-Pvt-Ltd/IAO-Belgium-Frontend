import axiosInstance from "./axiosintercepter";

export const getAcademics = async (filter) => {
  try {
    const response = await axiosInstance.get(`/academic`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createAcademic = async (data) => {
  try {
    const response = await axiosInstance.post(`/academic`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateAcademic = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/academic/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const duplicateAcademic = async (id) => {
  try {
    const response = await axiosInstance.patch(`/academic/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
