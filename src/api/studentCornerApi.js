import axiosInstance from "./axiosintercepter";

export const getStudentCornerConfig = async () => {
  try {
    const response = await axiosInstance.get(`/student-corner`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateStudentCornerConfig = async (data) => {
  try {
    const response = await axiosInstance.put(`/student-corner`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
