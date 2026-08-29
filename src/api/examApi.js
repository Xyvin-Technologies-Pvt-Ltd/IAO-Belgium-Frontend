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

export const unarchiveExam = async (id) => {
  const response = await axiosInstance.put(`/exam/${id}/unarchive`);
  return response.data;
};

export const getTeacherExams = async (params) => {
  const response = await axiosInstance.get("/exam/teacher", { params });
  return response.data;
};

export const getTeacherPracticalExams = async (params) => {
  const response = await axiosInstance.get("/exam/teacher/practical-exams", { params });
  return response.data;
};

export const getPracticalExamDetail = async (id) => {
  const response = await axiosInstance.get(`/exam/teacher/practical-exams/${id}`);
  return response.data;
};

export const getPracticalExamStudents = async (id, params) => {
  const response = await axiosInstance.get(
    `/exam/teacher/practical-exams/${id}/students`,
    { params },
  );
  return response.data;
};

export const getPracticalExamFeedback = async (id, applicationId) => {
  const response = await axiosInstance.get(
    `/exam/teacher/practical-exams/${id}/students/${applicationId}/feedback`,
  );
  return response.data;
};

export const upsertPracticalExamFeedback = async (id, applicationId, payload) => {
  const response = await axiosInstance.put(
    `/exam/teacher/practical-exams/${id}/students/${applicationId}/feedback`,
    payload,
  );
  return response.data;
};

export const getTeacherOtherExams = async (params) => {
  const response = await axiosInstance.get("/exam/teacher/other-exams", { params });
  return response.data;
};

export const getOtherExamDetail = async (exam_id) => {
  const response = await axiosInstance.get(`/exam/teacher/other-exams/${exam_id}`);
  return response.data;
};

export const getOtherExamStudents = async (exam_id, params) => {
  const response = await axiosInstance.get(
    `/exam/teacher/other-exams/${exam_id}/students`,
    { params },
  );
  return response.data;
};

export const getTeacherExamById = async (exam_id, planning_id) => {
  const response = await axiosInstance.get(`/exam/teacher/${exam_id}/${planning_id}`);
  return response.data;
};

export const startExamSession = async (data) => {
  const response = await axiosInstance.post("/exam-session/start", data);
  return response.data;
};

export const endExamSession = async (id) => {
  const response = await axiosInstance.post(`/exam-session/${id}/end`);
  return response.data;
};
export const getExamResults = async (exam_id, planning_id, params) => {
  const response = await axiosInstance.get(
    `/exam/teacher/${exam_id}/${planning_id}/results`,
    { params },
  );
  return response.data;
};

export const getStudentAnswerSheet = async (attempt_id) => {
  const response = await axiosInstance.get(
    `/exam/teacher/attempt/${attempt_id}/answers`,
  );
  return response.data;
};

export const getAdminExamResults = async (params) => {
  const response = await axiosInstance.get("/exam/admin/results", { params });
  return response.data;
};

export const exportAdminExamResults = async (params) => {
  const response = await axiosInstance.get("/exam/admin/results/export", { params });
  return response.data;
};

export const getAdminPracticalExamResults = async (params) => {
  const response = await axiosInstance.get("/exam/admin/practical-results", { params });
  return response.data;
};

export const exportAdminPracticalExamResults = async (params) => {
  const response = await axiosInstance.get("/exam/admin/practical-results/export", { params });
  return response.data;
};

export const getStudentPracticalDetailAdmin = async (plannedId, applicationId) => {
  const response = await axiosInstance.get(`/exam/admin/practical-results/${plannedId}/students/${applicationId}`);
  return response.data;
};

export const setStudentPracticalScoreAdmin = async (plannedId, applicationId, score) => {
  const response = await axiosInstance.put(`/exam/admin/practical-results/${plannedId}/students/${applicationId}`, { score });
  return response.data;
};
