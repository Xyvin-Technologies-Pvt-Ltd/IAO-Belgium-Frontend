import axiosInstance from "./axiosintercepter";

export const getTeacherNotifications = async (filter) => {
  try {
    const response = await axiosInstance.get(`/notification/teacher`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const response = await axiosInstance.patch(`/notification/${id}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUnreadTeacherNotificationsCount = async () => {
  try {
    const response = await axiosInstance.get(`/notification/teacher/unread-count`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
