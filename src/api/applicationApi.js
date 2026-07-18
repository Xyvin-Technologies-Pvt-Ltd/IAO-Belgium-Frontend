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

export const putApplication = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/application/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getModuleSelection = async (id) => {
  try {
    const response = await axiosInstance.get(`/application/${id}/module-selection`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateModuleSelection = async (id, selectedModules) => {
  try {
    const response = await axiosInstance.patch(`/application/${id}/module-selection`, {
      selected_modules: selectedModules
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
