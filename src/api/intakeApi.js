import axiosInstance from "./axiosintercepter";

export const getIntakes = async (academicId, filter) => {
  try {
    const response = await axiosInstance.get(`/academic/intakes/${academicId}`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getIntakeById = async (id) => {
  try {
    const response = await axiosInstance.get(`/intake/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createIntake = async (data) => {
  try {
    const response = await axiosInstance.post(`/intake`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateintake = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/intake/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteIntake = async (id) => {
  try {
    const response = await axiosInstance.delete(`/intake/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getBatchByIntake = async (id) => {
  try {
    const response = await axiosInstance.get(`/intake/batches/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getEnrolledStudentsByIntake = async (id) => {
  try {
    const response = await axiosInstance.get(`/intake/enrollments/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getStudentByApplication = async (applicationId) => {
  try {
    const response = await axiosInstance.get(`/intake/application/student/${applicationId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  } 
};