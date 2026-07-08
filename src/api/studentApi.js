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

export const exportStudents = async (params) => {
  try {
    const response = await axiosInstance.get(`/user/student/export`, {
      params,
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
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

export const getSpecialExceptions = async () => {
  try {
    const response = await axiosInstance.get("/special-exceptions");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateStudentSpecialExceptions = async (id, specialExceptions) => {
  try {
    const response = await axiosInstance.put(`/user/student/${id}/special-exceptions`, {
      special_exceptions: specialExceptions,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createSpecialException = async (data) => {
  try {
    const response = await axiosInstance.post("/special-exceptions", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateSpecialException = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/special-exceptions/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteSpecialException = async (id) => {
  try {
    const response = await axiosInstance.delete(`/special-exceptions/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
