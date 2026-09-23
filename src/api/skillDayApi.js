import axiosInstance from "./axiosintercepter";

export const getAllSkillDays = async (params) => {
  try {
    const response = await axiosInstance.get("/skill-day", { params });
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const getSkillDayById = async (id) => {
  try {
    const response = await axiosInstance.get(`/skill-day/${id}`);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const createSkillDay = async (data) => {
  try {
    const response = await axiosInstance.post("/skill-day", data);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const updateSkillDay = async ({ id, ...data }) => {
  try {
    const response = await axiosInstance.put(`/skill-day/${id}`, data);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const deleteSkillDay = async (id) => {
  try {
    const response = await axiosInstance.delete(`/skill-day/${id}`);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const addAttachment = async ({ skillDayId, ...data }) => {
  try {
    const response = await axiosInstance.post(`/skill-day/${skillDayId}/attachment`, data);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const updateAttachment = async ({ skillDayId, attachmentId, ...data }) => {
  try {
    const response = await axiosInstance.put(`/skill-day/${skillDayId}/attachment/${attachmentId}`, data);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const removeAttachment = async ({ skillDayId, attachmentId }) => {
  try {
    const response = await axiosInstance.delete(`/skill-day/${skillDayId}/attachment/${attachmentId}`);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const getAttachmentStudents = async ({ skillDayId, attachmentId }) => {
  try {
    const response = await axiosInstance.get(`/skill-day/${skillDayId}/attachment/${attachmentId}/students`);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};
