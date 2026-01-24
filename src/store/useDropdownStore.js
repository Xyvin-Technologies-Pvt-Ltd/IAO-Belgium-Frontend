import {
  getAllCities,
  getAllCountry,
  getAllLanguages,
  getAllPrograms,
  getAllRoles,
  getAllTeacherRoles,
  getAllTeacherTitles,
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