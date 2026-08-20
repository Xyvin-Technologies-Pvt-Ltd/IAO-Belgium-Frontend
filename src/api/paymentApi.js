import axiosInstance from "./axiosintercepter";

export const getPayments = async (filter) => {
  try {
    const response = await axiosInstance.get(`/invoice`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getTransactionLogs = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByCity = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/city`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByCityList = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/city/list`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByProgram = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/program`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByProgramList = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/program/list`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByBatch = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/batch`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByBatchList = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/batch/list`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAnalyticsByStudent = async (filter) => {
  try {
    const response = await axiosInstance.get(`/payment/analytics/student`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getInvoiceHtml = async (id) => {
  try {
    const response = await axiosInstance.get(`/payment/invoice/${id}`, { responseType: "text" });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getInvoicePrintHtml = async (id) => {
  try {
    const response = await axiosInstance.get(`/invoice/${id}/html`, { responseType: "text" });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createPayment = async (data) => {
  try {
    const response = await axiosInstance.post(`/payment`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getKmoApplications = async (filter) => {
  try {
    const response = await axiosInstance.get(`/kmo/applications`, { params: filter });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateKmoStatus = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/kmo/applications/${id}/status`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getThirdPartyApplications = async (filter) => {
  try {
    const response = await axiosInstance.get(`/third-party-payment/applications`, { params: filter });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const adminCancelThirdParty = async (id) => {
  try {
    const response = await axiosInstance.put(`/third-party-payment/${id}/admin-cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const adminReconcileThirdParty = async (id) => {
  try {
    const response = await axiosInstance.post(`/third-party-payment/${id}/admin-reconcile`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};