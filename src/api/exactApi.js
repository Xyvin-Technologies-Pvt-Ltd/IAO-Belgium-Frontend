import axiosInstance from "./axiosintercepter";

export const getExactStatus = async () => {
  try {
    const response = await axiosInstance.get("/exact/status");
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

export const backfillExactContacts = async () => {
  try {
    const response = await axiosInstance.post("/exact/backfill-contacts");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const startMollieRefBackfill = async (body = {}) => {
  try {
    const response = await axiosInstance.post("/exact/backfill-mollie-ref", body);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMollieRefBackfillStatus = async () => {
  try {
    const response = await axiosInstance.get("/exact/backfill-mollie-ref/status");
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

// ─── Manual / automatic sending (Sales Entries) ──────────────────────────────

export const getExactSendMode = async () => {
  try {
    const response = await axiosInstance.get("/exact/send-mode");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const setExactSendMode = async (mode) => {
  try {
    const response = await axiosInstance.put("/exact/send-mode", { mode });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getExactToSend = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/exact/to-send", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getExactToSendPreview = async (jobId) => {
  try {
    const response = await axiosInstance.get(
      `/exact/to-send/${encodeURIComponent(jobId)}/preview`,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const sendExactJob = async (jobId) => {
  try {
    const response = await axiosInstance.post(
      `/exact/to-send/${encodeURIComponent(jobId)}/send`,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

//* Read-only: can the Exact app attach the IAO PDF (documents permission)?
export const getExactDocumentTypes = async () => {
  try {
    const response = await axiosInstance.get("/exact/document-types");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ─── To send → Missing ───────────────────────────────────────────────────────

//* Records that should be in Exact but aren't (payments + third-party invoices).
export const getExactMissing = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/exact/missing", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

//* Queue one Missing record for To send. Never sends: an admin still previews it.
export const addExactToOutbox = async ({ kind, id }) => {
  try {
    const response = await axiosInstance.post("/exact/outbox/add", { kind, id });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
