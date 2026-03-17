import { getStudentAttendance, getStudentById, getStudents } from "@/api/studentApi";
import { useQuery } from "@tanstack/react-query";

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