import axiosInstance from "./axiosintercepter";

export const getTheses = async (filter) => {
  try {
    const response = await axiosInstance.get(`/thesis`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getThesisById = async (id) => {
  try {
    const response = await axiosInstance.get(`/thesis/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createThesis = async (data) => {
  try {
    const response = await axiosInstance.post(`/thesis`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateThesis = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/thesis/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateThesisStatus = async (id, status) => {
  try {
    const response = await axiosInstance.patch(`/thesis/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getThesisRoles = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/thesis/roles`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createThesisRole = async (data) => {
  try {
    const response = await axiosInstance.post(`/thesis/roles`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getThesisRoleById = async (id) => {
  try {
    const response = await axiosInstance.get(`/thesis/roles/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateThesisRole = async (id, data) => {
  try {
    const response = await axiosInstance.patch(`/thesis/roles/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteThesisRole = async (id) => {
  try {
    const response = await axiosInstance.delete(`/thesis/roles/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getThesisTeachers = async (thesisId, filter = {}) => {
  try {
    const response = await axiosInstance.get(`/thesis/${thesisId}/teachers`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createExternalThesisTeacher = async (thesisId, data) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/teachers/external`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateExternalThesisTeacher = async (thesisId, assignmentId, data) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/${thesisId}/teachers/${assignmentId}/external`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const assignThesisTeacher = async (thesisId, data) => {
  try {
    const response = await axiosInstance.post(`/thesis/${thesisId}/teachers`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateThesisTeacherRole = async (thesisId, assignmentId, data) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/${thesisId}/teachers/${assignmentId}/roles`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const removeThesisTeacher = async (thesisId, assignmentId) => {
  try {
    const response = await axiosInstance.delete(
      `/thesis/${thesisId}/teachers/${assignmentId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getThesisSteps = async (thesisId) => {
  try {
    const response = await axiosInstance.get(`/thesis/${thesisId}/steps`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveThesisSteps = async (thesisId, data) => {
  try {
    const response = await axiosInstance.put(`/thesis/${thesisId}/steps`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTrajectories = async (thesisId) => {
  try {
    const response = await axiosInstance.get(`/thesis/${thesisId}/trajectories`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createTrajectory = async (thesisId, data) => {
  try {
    const response = await axiosInstance.post(`/thesis/${thesisId}/trajectories`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTrajectory = async (thesisId, trajectoryId, data) => {
  try {
    const response = await axiosInstance.put(
      `/thesis/${thesisId}/trajectories/${trajectoryId}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteTrajectory = async (thesisId, trajectoryId) => {
  try {
    const response = await axiosInstance.delete(
      `/thesis/${thesisId}/trajectories/${trajectoryId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getThesisDeadlines = async (thesisId) => {
  try {
    const response = await axiosInstance.get(`/thesis/${thesisId}/deadlines`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveThesisDeadlines = async (thesisId, data) => {
  try {
    const response = await axiosInstance.put(`/thesis/${thesisId}/deadlines`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTrajectoryStudents = async (thesisId, trajectoryId, params = {}) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTrajectoryStudentDetail = async (thesisId, trajectoryId, userId) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTrajectoryStudentReader = async (
  thesisId,
  trajectoryId,
  userId,
  data
) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTrajectoryStudentSupervisor = async (
  thesisId,
  trajectoryId,
  userId,
  data
) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/supervisor`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTrajectoryStudentAttemptStatus = async (
  thesisId,
  trajectoryId,
  userId,
  data
) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/status`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const reenrollTrajectoryStudent = async (
  thesisId,
  trajectoryId,
  userId,
  data
) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/reenroll`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTrajectoryStudentStepDeadline = async (
  thesisId,
  trajectoryId,
  userId,
  stepId,
  data
) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/steps/${stepId}/deadline`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const uploadStaffThesisDocument = async (
  thesisId,
  trajectoryId,
  userId,
  stepId,
  data
) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/steps/${stepId}/documents`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const renameStaffThesisDocument = async (
  thesisId,
  trajectoryId,
  userId,
  stepId,
  documentId,
  data
) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/steps/${stepId}/documents/${documentId}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteStaffThesisDocument = async (
  thesisId,
  trajectoryId,
  userId,
  stepId,
  documentId
) => {
  try {
    const response = await axiosInstance.delete(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/steps/${stepId}/documents/${documentId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeacherThesisStudents = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/thesis/teacher/students`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeacherThesisStudentDetail = async (
  thesisId,
  trajectoryId,
  userId
) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/teacher/theses/${thesisId}/trajectories/${trajectoryId}/students/${userId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeacherThesisApprovalRequests = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/thesis/teacher/approval-requests`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const respondTeacherThesisApprovalRequest = async (requestId, data) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/teacher/approval-requests/${requestId}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeacherThesisContactCard = async () => {
  try {
    const response = await axiosInstance.get(`/thesis/teacher/contact-card`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveTeacherThesisContactCard = async (data) => {
  try {
    const response = await axiosInstance.put(
      `/thesis/teacher/contact-card`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStudentPersonalNotes = async (thesisId, trajectoryId, userId) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/notes`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createStudentPersonalNote = async (
  thesisId,
  trajectoryId,
  userId,
  data
) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/notes`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


