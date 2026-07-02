import axiosInstance from "./axiosintercepter";

export const getAdminDashboardStats = async () => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/stats`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeacherDashboardStats = async () => {
  try {
    const response = await axiosInstance.get(`/teacher/dashboard/stats`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
