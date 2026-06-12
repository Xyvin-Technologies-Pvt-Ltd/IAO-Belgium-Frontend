import axiosInstance from "./axiosintercepter";

export const getIntakes = async (academicId, filter) => {
  try {
    const response = await axiosInstance.get(
      `/academic/intakes/${academicId}`,
      {
        params: filter,
      },
    );
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
export const getBatchByIntake = async (id, filter) => {
  try {
    const response = await axiosInstance.get(`/intake/batches/${id}`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getEnrolledStudentsByIntake = async (id,filter) => {
  try {
    const response = await axiosInstance.get(`/intake/enrollments/${id}`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getStudentByApplication = async (applicationId) => {
  try {
    const response = await axiosInstance.get(
      `/intake/application/student/${applicationId}`,
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const moveStudentToAnotherBatch = async (id, data) => {
  try {
    const response = await axiosInstance.post(
      `/application/${id}/move-batch`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const markStudentAsFailed = async (applicationId, data) => {
  try {
    const response = await axiosInstance.put(
      `/application/${applicationId}/mark-failed`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const reEnrollStudent = async (applicationId, data) => {
  try {
    const response = await axiosInstance.put(
      `/application/${applicationId}/re-enroll`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getBatchesByProgram = async (programId) => {
  try {
    const response = await axiosInstance.get(`/batch/by-program/${programId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
