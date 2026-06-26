import axiosInstance from "./axiosintercepter";

export const createComponent = async (data) => {
  try {
    const response = await axiosInstance.post(`/components`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getComponents = async (filter) => {
  try {
    const response = await axiosInstance.get(`/components`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateComponent = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/components/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getStudentsByComponent = async (id,filter) => {
  try {
    const response = await axiosInstance.get(`/student/planning/${id}/students`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getComponentFilterOptions = async (filter) => {
  try {
    const response = await axiosInstance.get(`/components/filter-options`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getComponentById= async (id) => {
  try {
    const response = await axiosInstance.get(`/components/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}