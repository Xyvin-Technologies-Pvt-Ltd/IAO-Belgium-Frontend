import axiosInstance from "./axiosintercepter";

export const getPlannings = async (filter) => {
  try {
    const response = await axiosInstance.get(`/planning`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createPlanning = async (data) => {
  try {
    const response = await axiosInstance.post(`/planning`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updatePlanning = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/planning/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deletePlanning = async (id) => {
  try {
    const response = await axiosInstance.delete(`/planning/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getPlanningByTeacher = async (filter) => {
  try {
    const response = await axiosInstance.get(`/planning/teacher`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateTeacherStatus = async (id, data) => {
  try {
    const response = await axiosInstance.patch(
      `/planning/session/${id}/teacher-status`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
