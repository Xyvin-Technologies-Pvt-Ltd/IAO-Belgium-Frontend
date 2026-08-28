import axiosInstance from "./axiosintercepter";

export const createResitPlanning = async (data) => {
  const response = await axiosInstance.post("/resit/plannings", data);
  return response.data;
};

export const updateResitPlanning = async (id, data) => {
  const response = await axiosInstance.patch(`/resit/plannings/${id}`, data);
  return response.data;
};

export const getResitPlannings = async (params = {}) => {
  const response = await axiosInstance.get("/resit/plannings", { params });
  return response.data;
};

export const assignResitStudents = async (data) => {
  const response = await axiosInstance.post("/resit/assignments", data);
  return response.data;
};

export const cancelResitAssignment = async (id) => {
  const response = await axiosInstance.delete(`/resit/assignments/${id}`);
  return response.data;
};

export const updateResitTeacherStatus = async (id, data) => {
  const response = await axiosInstance.patch(`/resit/plannings/${id}/teacher-status`, data);
  return response.data;
};
