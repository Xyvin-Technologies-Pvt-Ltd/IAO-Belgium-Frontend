import {
  getStudentAttendance,
  getStudentPayments,
  getStudentInvoices,
  getStudentReceipts,
  getStudentById,
  getStudents,
  getSpecialExceptions,
  updateStudentSpecialExceptions,
  createSpecialException,
  updateSpecialException,
  deleteSpecialException,
  getLocationChanges,
} from "@/api/studentApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetStudents = (filter, options = {}) => {
  return useQuery({
    queryKey: ["student-list", filter],
    queryFn: () => getStudents(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useGetStudentById = (id, filter, options = {}) => {
  return useQuery({
    queryKey: ["student", id, filter],
    queryFn: () => getStudentById(id, filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetStudentAttendance = (id, filter, options = {}) => {
  return useQuery({
    queryKey: ["student-attendance", id, filter],
    queryFn: () => getStudentAttendance(id, filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetStudentPayments = (id, filter = {}, options = {}) => {
  return useQuery({
    queryKey: ["student-payments", id, filter],
    queryFn: () => getStudentPayments(id, filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetStudentInvoices = (id, filter = {}, options = {}) => {
  return useQuery({
    queryKey: ["student-invoices", id, filter],
    queryFn: () => getStudentInvoices(id, filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetStudentReceipts = (id, filter = {}, options = {}) => {
  return useQuery({
    queryKey: ["student-receipts", id, filter],
    queryFn: () => getStudentReceipts(id, filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetSpecialExceptions = (options = {}) => {
  return useQuery({
    queryKey: ["special-exceptions"],
    queryFn: getSpecialExceptions,
    staleTime: 30000,
    ...options,
  });
};

export const useUpdateStudentSpecialExceptions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, specialExceptions }) => updateStudentSpecialExceptions(id, specialExceptions),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student", variables.id] });
    },
  });
};

export const useCreateSpecialException = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createSpecialException(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-exceptions"] });
    },
  });
};

export const useUpdateSpecialException = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateSpecialException(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-exceptions"] });
    },
  });
};

export const useDeleteSpecialException = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteSpecialException(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-exceptions"] });
    },
  });
};

export const useGetLocationChanges = (filter, options = {}) => {
  return useQuery({
    queryKey: ["student-location-changes", filter],
    queryFn: () => getLocationChanges(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
