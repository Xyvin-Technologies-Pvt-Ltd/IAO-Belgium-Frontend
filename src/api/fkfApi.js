import axiosInstance from "./axiosintercepter";

export const getFkfConfig = async () => {
  const response = await axiosInstance.get("/fkf/config");
  return response.data;
};

export const updateFkfConfig = async (data) => {
  const response = await axiosInstance.put("/fkf/config", data);
  return response.data;
};

export const getFkfStudentModules = async (studentId) => {
  const response = await axiosInstance.get(
    `/fkf/students/${studentId}/modules`,
  );
  return response.data;
};

export const getFkfModules = async (params = {}) => {
  const response = await axiosInstance.get("/fkf/modules", { params });
  return response.data;
};

export const getFkfStudents = async (params = {}) => {
  const response = await axiosInstance.get("/fkf/students", { params });
  return response.data;
};

export const getFkfEligibleStudents = async (params = {}) => {
  const response = await axiosInstance.get("/fkf/students/eligible", {
    params,
  });
  return response.data;
};

export const markFkfEligible = async (data) => {
  const response = await axiosInstance.post("/fkf/students/mark-eligible", data);
  return response.data;
};

export const unmarkFkfEligible = async (data) => {
  const response = await axiosInstance.post(
    "/fkf/students/unmark-eligible",
    data,
  );
  return response.data;
};

export const exportFkfStudents = async (params = {}) => {
  const response = await axiosInstance.get("/fkf/students/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export const getFkfInvoices = async (params = {}) => {
  const response = await axiosInstance.get("/fkf/invoices", { params });
  return response.data;
};

export const createFkfInvoice = async (data) => {
  const response = await axiosInstance.post("/fkf/invoices", data);
  return response.data;
};

export const previewFkfBulkInvoices = async (data) => {
  const response = await axiosInstance.post("/fkf/invoices/bulk/preview", data);
  return response.data;
};

export const createFkfBulkInvoices = async (data) => {
  const response = await axiosInstance.post("/fkf/invoices/bulk", data);
  return response.data;
};
