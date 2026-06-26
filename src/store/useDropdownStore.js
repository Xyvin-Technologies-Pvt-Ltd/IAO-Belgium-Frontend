import {
  getAllCities,
  getAllCountry,
  getAllLanguages,
  getAllPrograms,
  getAllRoles,
  getAllTeacherRoles,
  getAllTeacherTitles,
  getBatches,
  getComponents,
  getUsers,
  getTeacherModules,
  getAllAcademicYears,
  getAllContractTypes,
  getAllDepartments,
  getAllRegions,
  getAllTeachingRegions,
} from "@/api/dropDownApi";
import { useQuery } from "@tanstack/react-query";

export const useGetAllCountries = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-countries", filter],
    queryFn: () => getAllCountry(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllTeacherRoles = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-teacher-roles", filter],
    queryFn: () => getAllTeacherRoles(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllTeacherTitle = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-teacher-title", filter],
    queryFn: () => getAllTeacherTitles(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useGetAllPrograms = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-programs", filter],
    queryFn: () => getAllPrograms(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllCities = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-cities", filter],
    queryFn: () => getAllCities(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

// Programs filtered by selected city and/or language (cascaded)
export const useGetProgramsByCitiesAndLanguages = (cityId = "", languageId = "", options = {}) => {
  return useQuery({
    queryKey: ["programs-by-city-language", cityId, languageId],
    queryFn: () => {
      const params = { status: "active" };
      if (cityId) params.city = cityId;
      if (languageId) params.language = languageId;
      return getAllPrograms(params);
    },
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllLanguages = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-languages", filter],
    queryFn: () => getAllLanguages(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllRoles= (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-roles", filter],
    queryFn: () => getAllRoles(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useGetBatches= (id, filter, options = {}) => {
  return useQuery({
    queryKey: ["all-batches", id, filter],
    queryFn: () => getBatches(id, filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    enabled: !!id, // Only run query when id is provided
    ...options,
  });
};
export const useGetComponents= (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-components", filter],
    queryFn: () => getComponents(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetUsers = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-users", filter],
    queryFn: () => getUsers(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAdminDropdown = (options = {}) => {
  return useQuery({
    queryKey: ["admin-dropdown"],
    queryFn: () => getUsers({ role: "admin" }),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetTeacherModules = (filter, options = {}) => {
  return useQuery({
    queryKey: ["teacher-modules", filter],
    queryFn: () => getTeacherModules(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllAcademicYears = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-academic-years", filter],
    queryFn: () => getAllAcademicYears(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllContractTypes = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-contract-types", filter],
    queryFn: () => getAllContractTypes(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllDepartments = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-departments", filter],
    queryFn: () => getAllDepartments(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllRegions = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-regions", filter],
    queryFn: () => getAllRegions(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAllTeachingRegions = (filter, options = {}) => {
  return useQuery({
    queryKey: ["all-teaching-regions", filter],
    queryFn: () => getAllTeachingRegions(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};