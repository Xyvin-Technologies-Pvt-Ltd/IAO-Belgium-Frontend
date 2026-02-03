import { getStudentById, getStudents } from "@/api/studentApi";
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
export const useGetStudentById = (id, options = {}) => {
  return useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudentById(id),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};