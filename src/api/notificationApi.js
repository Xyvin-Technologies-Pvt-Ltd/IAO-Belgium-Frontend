import axiosInstance from "./axiosintercepter";

export const getTeacherNotifications = async (filter) => {
  try {
    const response = await axiosInstance.get(`/notification/me`, {
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

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await axiosInstance.patch(`/notification/read-all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUnreadTeacherNotificationsCount = async () => {
  try {
    const response = await axiosInstance.get(`/notification/me/unread-count`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ─── Admin-facing ─────────────────────────────────────────────────────────────

export const getAdminNotifications = async (params) => {
  try {
    const response = await axiosInstance.get(`/notification`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createAdminNotification = async (data) => {
  try {
    const response = await axiosInstance.post(`/notification`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateAdminNotification = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/notification/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteAdminNotification = async (id) => {
  try {
    const response = await axiosInstance.delete(`/notification/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const sendAdminNotification = async (id) => {
  try {
    const response = await axiosInstance.post(`/notification/${id}/send`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const previewNotificationCount = async (data) => {
  try {
    const response = await axiosInstance.post(`/notification/preview-count`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNotificationById = async (id) => {
  try {
    const response = await axiosInstance.get(`/notification/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNotificationRecipients = async (id, params) => {
  try {
    const response = await axiosInstance.get(`/notification/${id}/recipients`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
