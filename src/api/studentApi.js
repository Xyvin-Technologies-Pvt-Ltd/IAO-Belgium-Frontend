import axiosInstance from "./axiosintercepter";

export const getStudentByApplication = async (applicationId) => {
  try {
    const response = await axiosInstance.get(`/intake/application/student/${applicationId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  } 
};