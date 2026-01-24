import axiosInstance from "./axiosintercepter";

export const getAllCountry = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/country/dropdown`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getAllTeacherRoles= async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/teacher-role/dropdown`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}

export const getAllLanguages= async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/language/dropdown`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
export const getAllTeacherTitles= async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/teacher-title/dropdown`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}

export const getAllPrograms= async (filter) => {
  try {
    const response = await axiosInstance.get(`/program/dropdown`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
export const getAllCities= async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/city/dropdown`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
export const getAllRoles= async (filter) => {
  try {
    const response = await axiosInstance.get(`/role/dropdown`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}