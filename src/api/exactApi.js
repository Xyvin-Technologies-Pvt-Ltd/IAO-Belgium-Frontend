import axiosInstance from "./axiosintercepter";

export const getExactStatus = async () => {
  try {
    const response = await axiosInstance.get("/exact/status");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getExactUnsynced = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/exact/unsynced", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getExactSent = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/exact/sent", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const reconcileExact = async () => {
  try {
    const response = await axiosInstance.post("/exact/reconcile");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const backfillExactContacts = async () => {
  try {
    const response = await axiosInstance.post("/exact/backfill-contacts");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const disconnectExact = async () => {
  try {
    const response = await axiosInstance.delete("/exact/disconnect");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const getExactReconciliation = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/exact/reconciliation", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

//* Returns raw CSV text (not the JSON envelope) for downloadCsv().
export const exportExactReconciliation = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/exact/reconciliation/export", {
      params,
      responseType: "text",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyExactReconciliation = async (ids = []) => {
  try {
    const response = await axiosInstance.post("/exact/reconciliation/verify", {
      ids,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
