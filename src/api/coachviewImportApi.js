import axiosInstance from "./axiosintercepter";

export const getCoachviewImportStatus = async () => {
  try {
    const response = await axiosInstance.get(`/coachview-import/status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCoachviewCohorts = async (filter) => {
  try {
    const response = await axiosInstance.get(`/coachview-import/cohorts`, { params: filter });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const previewCoachviewCohort = async (opleidingId, batchId) => {
  try {
    const response = await axiosInstance.get(
      `/coachview-import/cohorts/${opleidingId}/preview`,
      { params: { batch_id: batchId } },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const migrateCoachviewCohort = async (batchId, payload) => {
  try {
    const response = await axiosInstance.post(
      `/coachview-import/batches/${batchId}/migrate`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

//* Manual "add students" flow — searches individual CoachView persons
//* rather than a whole cohort, for people who never landed in a cohort the
//* API exposes (CoachView back-door entries).
export const getCoachviewPersons = async (filter) => {
  try {
    const response = await axiosInstance.get(`/coachview-import/persons`, { params: filter });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const previewCoachviewStudents = async (batchId, cvIds) => {
  try {
    const response = await axiosInstance.post(
      `/coachview-import/batches/${batchId}/students/preview`,
      { cv_ids: cvIds },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addCoachviewStudents = async (batchId, payload) => {
  try {
    const response = await axiosInstance.post(
      `/coachview-import/batches/${batchId}/students`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
