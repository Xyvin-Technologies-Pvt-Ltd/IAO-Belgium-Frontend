import axiosInstance from "./axiosintercepter";

//* A student's companies (admin may pass any user id).
export const getUserCompanies = async (userId) => {
  try {
    const response = await axiosInstance.get("/company", { params: { user_id: userId } });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCompany = async (companyId) => {
  try {
    const response = await axiosInstance.get(`/company/${companyId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

//* Country must be an ISO-2 code (the backend rejects anything else).
export const updateCompany = async ({ id, ...body }) => {
  try {
    const response = await axiosInstance.put(`/company/${id}`, body);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
