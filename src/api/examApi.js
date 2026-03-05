import axiosInstance from "./axiosintercepter";

export const getExams = async (params) => {
  const response = await axiosInstance.get("/exam", { params });
  return response.data;
};

export const getExamsDropdown = async (params = {}) => {
  const response = await axiosInstance.get("/exam/dropdown", { params });
  return response.data;
};

export const getExamById = async (id) => {
  const response = await axiosInstance.get(`/exam/${id}`);
  return response.data;
};

export const createExam = async (data) => {
  const response = await axiosInstance.post("/exam", data);
  return response.data;
};

export const updateExam = async (id, data) => {
  const response = await axiosInstance.put(`/exam/${id}`, data);
  return response.data;
};

export const publishExam = async (id) => {
  const response = await axiosInstance.put(`/exam/${id}/publish`);
  return response.data;
};

export const archiveExam = async (id) => {
  const response = await axiosInstance.put(`/exam/${id}/archive`);
  return response.data;
};

export const getTeacherExams = async (params) => {
  const response = await axiosInstance.get("/exam/teacher", { params });
  return response.data;
};

export const getTeacherExamById = async (id) => {
  const response = await axiosInstance.get(`/exam/teacher/${id}`);
  return response.data;
};
