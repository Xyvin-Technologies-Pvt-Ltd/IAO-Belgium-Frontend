import axiosInstance from "./axiosintercepter";

export const getExamAssignments = async (params) => {
  const response = await axiosInstance.get("/exam-assignment", { params });
  return response.data;
};

export const getExamAssignmentById = async (id) => {
  const response = await axiosInstance.get(`/exam-assignment/${id}`);
  return response.data;
};

export const createExamAssignment = async (data) => {
  const response = await axiosInstance.post("/exam-assignment", data);
  return response.data;
};

export const updateExamAssignment = async (id, data) => {
  const response = await axiosInstance.put(`/exam-assignment/${id}`, data);
  return response.data;
};

export const cancelExamAssignment = async (id) => {
  const response = await axiosInstance.put(`/exam-assignment/${id}/cancel`);
  return response.data;
};

export const getAssignmentResults = async (id, params) => {
  const response = await axiosInstance.get(
    `/exam-assignment/${id}/results`,
    { params },
  );
  return response.data;
};

export const getAttemptDetail = async (assignmentId, attemptId) => {
  const response = await axiosInstance.get(
    `/exam-assignment/${assignmentId}/results/${attemptId}`,
  );
  return response.data;
};

export const exportResultsCsv = async (id) => {
  const response = await axiosInstance.get(
    `/exam-assignment/${id}/results/export`,
    { responseType: "blob" },
  );
  return response;
};
