import axiosInstance from "./axiosintercepter";

export const getAdmins = async (filter) => {
  try {
    const response = await axiosInstance.get(`/user/admin`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createAdmin = async (data) => {
  try {
    const response = await axiosInstance.post(`/user/admin`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateAdmin = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/admin/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateAdminStatus = async (id, status) => {
  try {
    const response = await axiosInstance.patch(`/user/${id}/status`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteAdmin = async (id) => {
  try {
    const response = await axiosInstance.delete(`/admin/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const bulkDeleteAdmins = async (ids) => {
  try {
    const response = await axiosInstance.post(`/user/bulk-delete-admins`, {
      ids: ids,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
