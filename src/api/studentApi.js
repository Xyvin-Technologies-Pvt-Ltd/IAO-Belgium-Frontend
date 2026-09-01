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

export const getStudentPayments = async (id, filter = {}) => {
  try {
    const response = await axiosInstance.get(`/user/student/${id}/payments`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getStudentInvoices = async (id, filter = {}) => {
  try {
    const response = await axiosInstance.get(`/user/student/${id}/invoices`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getStudentReceipts = async (id, filter = {}) => {
  try {
    const response = await axiosInstance.get(`/user/student/${id}/receipts`, {
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

export const getLocationChanges = async (filter) => {
  try {
    const response = await axiosInstance.get(`/user/student/location-changes`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getModulesForLocationSwitch = async (studentId) => {
  try {
    const response = await axiosInstance.get(
      `/user/student/${studentId}/modules-for-switch`,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAdminStudentComponentSlots = async (studentId, systemId) => {
  try {
    const response = await axiosInstance.get(
      `/user/student/${studentId}/component/system-id/${systemId}`,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAdminChangeLocationQuote = async (
  studentId,
  currentPlanningId,
  newPlanningId,
) => {
  try {
    const response = await axiosInstance.get(
      `/user/student/${studentId}/change-location`,
      {
        params: {
          current_planning_id: currentPlanningId,
          new_planning_id: newPlanningId,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const adminSwapStudentLocation = async (
  studentId,
  currentPlanningId,
  newPlanningId,
) => {
  try {
    const response = await axiosInstance.patch(
      `/user/student/${studentId}/change-location`,
      {
        current_planning_id: currentPlanningId,
        new_planning_id: newPlanningId,
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
