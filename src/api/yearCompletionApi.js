import axiosInstance from "./axiosintercepter";

export const evaluateYearCompletion = async (application_id) => {
  try {
    const response = await axiosInstance.post(`/student/year-completion/evaluate`, {
      application_id,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const promoteYearCompletion = async (application_id) => {
  try {
    const response = await axiosInstance.post(`/student/year-completion/promote`, {
      application_id,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const demoteYearCompletion = async (application_id) => {
  try {
    const response = await axiosInstance.post(`/student/year-completion/demote`, {
      application_id,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getReattemptBatches = async (application_id, component_id) => {
  try {
    const response = await axiosInstance.get(`/student/modules/reattempt/batches`, {
      params: { application_id, component_id },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const assignModuleReattempt = async (payload) => {
  try {
    const response = await axiosInstance.post(`/student/modules/reattempt`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getModuleReattempts = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/student/modules/reattempts`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
