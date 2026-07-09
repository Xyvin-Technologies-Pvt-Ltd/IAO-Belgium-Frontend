import axiosInstance from "./axiosintercepter";

export const getAccountingMappings = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/accounting-mapping`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const resolveAccountingMapping = async ({ language, country, program_type }) => {
  try {
    const response = await axiosInstance.get(
      `/master-data/accounting-mapping/resolve`,
      {
        params: {
          language,
          program_type,
          ...(country ? { country } : {}),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getGlobalVatConfig = async () => {
  try {
    const response = await axiosInstance.get(
      `/master-data/accounting-mapping/global-vat`,
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createAccountingMapping = async (data) => {
  try {
    const response = await axiosInstance.post(
      `/master-data/accounting-mapping`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateAccountingMapping = async (id, data) => {
  try {
    const response = await axiosInstance.put(
      `/master-data/accounting-mapping/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteAccountingMapping = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/master-data/accounting-mapping/${id}`,
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateGlobalVatConfig = async (data) => {
  try {
    const response = await axiosInstance.put(
      `/master-data/accounting-mapping/global-vat`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
