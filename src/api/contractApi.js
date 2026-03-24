import axiosInstance from "./axiosintercepter";

export const getContracts = async (filter) => {
  try {
    const response = await axiosInstance.get(`/contract`, { params: filter });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};


export const createContract = async (data) => {
  try {
    const response = await axiosInstance.post(`/contract`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateContract = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/contract/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

