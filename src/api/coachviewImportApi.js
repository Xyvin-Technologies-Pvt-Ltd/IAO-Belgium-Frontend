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
