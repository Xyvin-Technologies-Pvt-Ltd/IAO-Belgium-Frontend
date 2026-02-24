import axiosInstance from "./axiosintercepter";

export const getQuestionBanks = async (params) => {
  const response = await axiosInstance.get("/question-bank", { params });
  return response.data;
};

export const getQuestionBanksDropdown = async (params = {}) => {
  const response = await axiosInstance.get("/question-bank/dropdown", {
    params,
  });
  return response.data;
};

export const getQuestionBankById = async (id) => {
  const response = await axiosInstance.get(`/question-bank/${id}`);
  return response.data;
};

export const createQuestionBank = async (data) => {
  const response = await axiosInstance.post("/question-bank", data);
  return response.data;
};

export const updateQuestionBank = async (id, data) => {
  const response = await axiosInstance.put(`/question-bank/${id}`, data);
  return response.data;
};

export const deleteQuestionBank = async (id) => {
  const response = await axiosInstance.delete(`/question-bank/${id}`);
  return response.data;
};

export const getQuestions = async (questionBankId, params) => {
  const response = await axiosInstance.get(
    `/question-bank/${questionBankId}/questions`,
    { params },
  );
  return response.data;
};

export const getQuestionById = async (questionBankId, questionId) => {
  const response = await axiosInstance.get(
    `/question-bank/${questionBankId}/questions/${questionId}`,
  );
  return response.data;
};

export const addQuestion = async (questionBankId, data) => {
  const response = await axiosInstance.post(
    `/question-bank/${questionBankId}/questions`,
    data,
  );
  return response.data;
};

export const updateQuestion = async (questionBankId, questionId, data) => {
  const response = await axiosInstance.put(
    `/question-bank/${questionBankId}/questions/${questionId}`,
    data,
  );
  return response.data;
};

export const deleteQuestion = async (questionBankId, questionId) => {
  const response = await axiosInstance.delete(
    `/question-bank/${questionBankId}/questions/${questionId}`,
  );
  return response.data;
};

export const bulkUploadQuestions = async (questionBankId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post(
    `/question-bank/${questionBankId}/questions/bulk-upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};
