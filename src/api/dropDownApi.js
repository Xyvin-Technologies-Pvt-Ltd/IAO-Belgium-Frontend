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

export const getBatches= async (id,filter) => {
  try {
    const response = await axiosInstance.get(`/intake/batches/program/${id}`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
export const getComponents= async (filter) => {
  try {
    const response = await axiosInstance.get(`/components/dropdown`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
export const getUsers= async (filter) => {
  try {
    const response = await axiosInstance.get(`/user/dropdown`,{
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}

export const getTeacherModules = async (filter) => {
  try {
    const response = await axiosInstance.get(`/planning/teacher/modules/dropdown`, {
      params: filter
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAllAcademicYears = async (filter) => {
  try {
    const response = await axiosInstance.get(`/academic/dropdown`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAllContractTypes = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/contract-type/dropdown`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAllDepartments = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/department/dropdown`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAllRegions = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/region/dropdown`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAllTeachingRegions = async (filter) => {
  try {
    const response = await axiosInstance.get(`/master-data/teaching-region/dropdown`, {
      params: filter,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};