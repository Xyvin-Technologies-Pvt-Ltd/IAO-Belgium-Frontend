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

// ─── Payouts (Mollie settlements ↔ Exact) ────────────────────────────────────

export const getExactPayouts = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/exact/payouts", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getExactPayout = async (settlementId) => {
  try {
    const response = await axiosInstance.get(`/exact/payouts/${encodeURIComponent(settlementId)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

//* Raw CSV text for downloadCsv().
export const exportExactPayout = async (settlementId) => {
  try {
    const response = await axiosInstance.get(`/exact/payouts/${encodeURIComponent(settlementId)}/export`, {
      responseType: "text",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const syncExactPayouts = async () => {
  try {
    const response = await axiosInstance.post("/exact/payouts/sync");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getExactPayoutsSyncStatus = async () => {
  try {
    const response = await axiosInstance.get("/exact/payouts/sync/status");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const queueExactPayoutMissing = async (settlementId) => {
  try {
    const response = await axiosInstance.post(`/exact/payouts/${encodeURIComponent(settlementId)}/queue-missing`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const sendExactPayoutWaiting = async (settlementId) => {
  try {
    const response = await axiosInstance.post(`/exact/payouts/${encodeURIComponent(settlementId)}/send-waiting`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ─── Company countries + bulk retry ──────────────────────────────────────────

export const getCompanyCountries = async () => {
  try {
    const response = await axiosInstance.get("/exact/company-countries");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const applyCompanyCountries = async () => {
  try {
    const response = await axiosInstance.post("/exact/company-countries/apply");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

//* Retry the listed To send jobs that are still failed (others are skipped).
export const retryExactJobs = async (jobIds = []) => {
  try {
    const response = await axiosInstance.post("/exact/to-send/retry", { job_ids: jobIds });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
