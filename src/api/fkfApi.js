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

export const getFkfBulkPreview = async (params = {}) => {
  const response = await axiosInstance.get("/fkf/invoices/bulk-preview", {
    params,
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

export const createFkfBulkInvoices = async (data) => {
  const response = await axiosInstance.post("/fkf/invoices/bulk", data);
  return response.data;
};
