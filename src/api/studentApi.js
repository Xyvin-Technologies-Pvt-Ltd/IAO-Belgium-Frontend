import axiosInstance from "./axiosintercepter";

export const getStudents = async (filter) => {
  try {
    const response = await axiosInstance.get(`/user/student`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getStudentById = async (id, filter) => {
  try {
    const response = await axiosInstance.get(`/user/student/${id}`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}

export const getStudentAttendance = async (id, filter) => {
  try {
    const response = await axiosInstance.get(`/user/attendance/${id}`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};