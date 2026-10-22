import axiosInstance from "./axiosintercepter";

export const searchModulesForAssign = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/student/module-overrides/search`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const assignStudentModule = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `/student/module-overrides/assign`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const removeStudentModule = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `/student/module-overrides/remove`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markStudentModulePaid = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `/student/module-overrides/mark-paid`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
