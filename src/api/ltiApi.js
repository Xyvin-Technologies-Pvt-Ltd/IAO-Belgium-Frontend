import axiosInstance from "./axiosintercepter";

// ── Tool Registration ──────────────────────────────────────────────────────

export const getLtiTools = async () => {
  try {
    const response = await axiosInstance.get("/lti/tools");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getLtiToolById = async (id) => {
  try {
    const response = await axiosInstance.get(`/lti/tools/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createLtiTool = async (data) => {
  try {
    const response = await axiosInstance.post("/lti/tools", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateLtiTool = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/lti/tools/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deactivateLtiTool = async (id) => {
  try {
    const response = await axiosInstance.delete(`/lti/tools/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ── Platform Config ────────────────────────────────────────────────────────

export const getLtiPlatformConfig = async () => {
  try {
    const response = await axiosInstance.get("/lti/platform-config");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
