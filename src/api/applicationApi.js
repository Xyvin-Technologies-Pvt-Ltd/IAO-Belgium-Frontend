import axiosInstance from "./axiosintercepter";

export const getApplications = async (filter) => {
  try {
    const response = await axiosInstance.get(`/application`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateApplication = async (id, data) => {
  try {
    const response = await axiosInstance.patch(`/application/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
