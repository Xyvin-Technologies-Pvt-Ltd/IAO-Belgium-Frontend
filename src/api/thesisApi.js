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

export const getThesisById = async (id, params = {}) => {
  try {
    const response = await axiosInstance.get(`/thesis/${id}`, {
      params,
    });
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

export const getThesisEligibleStudents = async (thesisId, params = {}) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/${thesisId}/students/eligible`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/** @deprecated Use getThesisEligibleStudents — eligibility is thesis-scoped */
export const getTrajectoryEligibleStudents = async (
  thesisId,
  _trajectoryId,
  params = {}
) => getThesisEligibleStudents(thesisId, params);

export const exportTrajectoryStudentsCsv = async (
  thesisId,
  trajectoryId,
  params = {}
) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/export-csv`,
      { params, responseType: "blob" }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const exportThesisEligibleStudentsCsv = async (
  thesisId,
  params = {}
) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/${thesisId}/students/eligible/export-csv`,
      { params, responseType: "blob" }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/** @deprecated Use exportThesisEligibleStudentsCsv */
export const exportTrajectoryEligibleStudentsCsv = async (
  thesisId,
  _trajectoryId,
  params = {}
) => exportThesisEligibleStudentsCsv(thesisId, params);

export const addThesisEligibleStudents = async (thesisId, userIds = []) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/eligible-students`,
      { user_ids: userIds }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/** @deprecated Use addThesisEligibleStudents */
export const addTrajectoryEligibleStudents = async (
  thesisId,
  _trajectoryId,
  userIds = []
) => addThesisEligibleStudents(thesisId, userIds);

export const removeThesisEligibleStudent = async (thesisId, userId) => {
  try {
    const response = await axiosInstance.delete(
      `/thesis/${thesisId}/eligible-students/${userId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/** @deprecated Use removeThesisEligibleStudent */
export const removeTrajectoryEligibleStudent = async (
  thesisId,
  _trajectoryId,
  userId
) => removeThesisEligibleStudent(thesisId, userId);

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

export const moveTrajectoryEnrolment = async (
  thesisId,
  trajectoryId,
  userId,
  data
) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/move-enrolment`,
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
  userId,
  params = {}
) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/teacher/theses/${thesisId}/trajectories/${trajectoryId}/students/${userId}`,
      { params }
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

export const getAdminStudentTheses = async (userId, params = {}) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/admin/students/${userId}/theses`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTrajectoryQnaAnnouncements = async (
  thesisId,
  trajectoryId,
  params = {}
) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/qna-announcements`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTrajectoryQnaAnnouncementById = async (
  thesisId,
  trajectoryId,
  itemId
) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/qna-announcements/${itemId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createTrajectoryQnaAnnouncement = async (
  thesisId,
  trajectoryId,
  data
) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/qna-announcements`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTrajectoryQnaAnnouncement = async (
  thesisId,
  trajectoryId,
  itemId,
  data
) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/qna-announcements/${itemId}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteTrajectoryQnaAnnouncement = async (
  thesisId,
  trajectoryId,
  itemId
) => {
  try {
    const response = await axiosInstance.delete(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/qna-announcements/${itemId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMarkingConfig = async (thesisId) => {
  try {
    const response = await axiosInstance.get(`/thesis/${thesisId}/marking-config`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveMarkingConfig = async (thesisId, data) => {
  try {
    const response = await axiosInstance.put(`/thesis/${thesisId}/marking-config`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getThesisEvaluation = async (thesisId, trajectoryId, userId) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/evaluation`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const editThesisEvaluation = async (thesisId, trajectoryId, userId, role, data) => {
  try {
    const response = await axiosInstance.patch(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/evaluation/${role}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const reopenThesisEvaluation = async (thesisId, trajectoryId, userId, role) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/evaluation/${role}/reopen`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const publishThesisEvaluation = async (
  thesisId,
  trajectoryId,
  userId,
  body
) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/evaluation/publish`,
      body
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const withdrawThesisEvaluation = async (thesisId, trajectoryId, userId) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/${thesisId}/trajectories/${trajectoryId}/students/${userId}/evaluation/withdraw`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeacherAssessment = async (thesisId, trajectoryId, userId) => {
  try {
    const response = await axiosInstance.get(
      `/thesis/teacher/theses/${thesisId}/trajectories/${trajectoryId}/students/${userId}/assessment`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveTeacherAssessmentDraft = async (thesisId, trajectoryId, userId, data) => {
  try {
    const response = await axiosInstance.put(
      `/thesis/teacher/theses/${thesisId}/trajectories/${trajectoryId}/students/${userId}/assessment`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitTeacherAssessment = async (thesisId, trajectoryId, userId, data) => {
  try {
    const response = await axiosInstance.post(
      `/thesis/teacher/theses/${thesisId}/trajectories/${trajectoryId}/students/${userId}/assessment/submit`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};



