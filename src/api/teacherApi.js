import axiosInstance from "./axiosintercepter";

export const getTeacher = async (filter) => {
  try {
    const response = await axiosInstance.get(`/user/teacher`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getTeacherById = async (id) => {
  try {
    const response = await axiosInstance.get(`/user/teacher/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
export const createTeacher = async (data) => {
  try {
    const response = await axiosInstance.post(`/user/teacher`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateTeacher = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/user/teacher/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteTeacher = async (id) => {
  try {
    const response = await axiosInstance.delete(`/user/teacher/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getSessionsByTeacherId = async (teacherId, params) => {
  try {
    const response = await axiosInstance.get(`/planning/teacher/${teacherId}/sessions`, { params });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const addTeacherAttachment = async (teacherId, data) => {
  try {
    const response = await axiosInstance.post(`/user/teacher/${teacherId}/attachments`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteTeacherAttachment = async (teacherId, attachmentId) => {
  try {
    const response = await axiosInstance.delete(`/user/teacher/${teacherId}/attachments/${attachmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
