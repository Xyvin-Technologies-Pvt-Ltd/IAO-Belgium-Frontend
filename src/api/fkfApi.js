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

export const createFkfInvoice = async (data) => {
  const response = await axiosInstance.post("/fkf/invoices", data);
  return response.data;
};
