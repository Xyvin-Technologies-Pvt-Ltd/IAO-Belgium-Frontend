import axiosInstance from "./axiosintercepter";

export const getAdminDashboardStats = async () => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/stats`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
