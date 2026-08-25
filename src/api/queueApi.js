import axiosInstance from "./axiosintercepter";

export const getQueueSummaries = async () => {
  try {
    const response = await axiosInstance.get("/queues");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getQueueJobs = async (queueName, params = {}) => {
  try {
    const response = await axiosInstance.get(`/queues/${queueName}/jobs`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getQueueJob = async (queueName, jobId) => {
  try {
    const response = await axiosInstance.get(
      `/queues/${queueName}/jobs/${jobId}`,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const removeQueueJob = async (queueName, jobId) => {
  try {
    const response = await axiosInstance.delete(
      `/queues/${queueName}/jobs/${jobId}`,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const bulkRemoveQueueJobs = async (queueName, jobIds) => {
  try {
    const response = await axiosInstance.post(
      `/queues/${queueName}/jobs/bulk-remove`,
      { job_ids: jobIds },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const retryQueueJob = async (queueName, jobId) => {
  try {
    const response = await axiosInstance.post(
      `/queues/${queueName}/jobs/${jobId}/retry`,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const cleanQueueJobs = async (queueName, params = {}) => {
  try {
    const response = await axiosInstance.delete(`/queues/${queueName}/clean`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
