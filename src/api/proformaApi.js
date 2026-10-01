import axiosInstance from "./axiosintercepter";

// Global Defaults & Category Toggles
export const getGlobalDefaults = async () => {
  try {
    const response = await axiosInstance.get(`/proforma-invoice/global-defaults`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateGlobalDefaults = async (data) => {
  try {
    const response = await axiosInstance.put(`/proforma-invoice/global-defaults`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Proforma Regions
export const getProformaRegions = async () => {
  try {
    const response = await axiosInstance.get(`/proforma-invoice/regions`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createProformaRegion = async (data) => {
  try {
    const response = await axiosInstance.post(`/proforma-invoice/regions`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateProformaRegion = async ({ id, data }) => {
  try {
    const response = await axiosInstance.put(`/proforma-invoice/regions/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteProformaRegion = async (id) => {
  try {
    const response = await axiosInstance.delete(`/proforma-invoice/regions/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Finance Queue
export const getFinanceQueue = async (filter) => {
  try {
    const response = await axiosInstance.get(`/proforma-invoice/finance-queue`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Generation Errors / Unprocessed Exceptions
export const getProformaErrors = async (filter) => {
  try {
    const response = await axiosInstance.get(`/proforma-invoice/errors`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Single Proforma
export const getProformaById = async (id) => {
  try {
    const response = await axiosInstance.get(`/proforma-invoice/invoices/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Teacher Digital Signature
export const signProforma = async ({ id, data }) => {
  try {
    const response = await axiosInstance.post(`/proforma-invoice/invoices/${id}/sign`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Add Miscellaneous Claim
export const addMiscellaneousClaim = async ({ id, data }) => {
  try {
    const response = await axiosInstance.post(`/proforma-invoice/invoices/${id}/miscellaneous`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Backoffice Update Status
export const updateProformaStatus = async ({ id, data }) => {
  try {
    const response = await axiosInstance.put(`/proforma-invoice/invoices/${id}/status`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update Section Approval Status
export const updateSectionApproval = async ({ id, section, status, action, notes }) => {
  try {
    const response = await axiosInstance.put(`/proforma-invoice/invoices/${id}/section-approval`, {
      section,
      status,
      action,
      notes,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Add Section Comment / Reply
export const addSectionComment = async ({ id, section, comment }) => {
  try {
    const response = await axiosInstance.post(`/proforma-invoice/invoices/${id}/section-comment`, {
      section,
      comment,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Edit Section Items
export const updateSectionItems = async ({ id, section, items }) => {
  try {
    const response = await axiosInstance.put(`/proforma-invoice/invoices/${id}/section-items`, {
      section,
      items,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Upload Attachment to Section
export const addSectionAttachment = async ({ id, section, files, file_name, file_url, file_type }) => {
  try {
    const response = await axiosInstance.post(`/proforma-invoice/invoices/${id}/section-attachment`, {
      section,
      files,
      file_name,
      file_url,
      file_type,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Teacher: Submit staged updates for admin review
export const submitTeacherUpdate = async ({ id, data }) => {
  try {
    const response = await axiosInstance.post(`/proforma-invoice/invoices/${id}/submit-update`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addProformaLineItem = async ({ id, data }) => {
  try {
    const response = await axiosInstance.post(`/proforma-invoice/invoices/${id}/items`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateProformaLineItem = async ({ id, itemId, data }) => {
  try {
    const response = await axiosInstance.put(`/proforma-invoice/invoices/${id}/items/${itemId}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const removeProformaLineItem = async ({ id, itemId }) => {
  try {
    const response = await axiosInstance.delete(`/proforma-invoice/invoices/${id}/items/${itemId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin: Send back to teacher with reason
export const sendBackToTeacher = async ({ id, data }) => {
  try {
    const response = await axiosInstance.post(`/proforma-invoice/invoices/${id}/send-back`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Temporary Test Trigger API
export const triggerPlanningProformaTest = async (planning_id) => {
  try {
    const response = await axiosInstance.post(`/proforma-invoice/test-trigger`, { planning_id });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
