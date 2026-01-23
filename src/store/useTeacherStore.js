import {
  createTeacher,
  deleteTeacher,
  getTeacher,
  getTeacherById,
  updateTeacher,
} from "@/api/teacherApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetTeachers = (filter, options = {}) => {
  return useQuery({
    queryKey: ["teachers", filter],
    queryFn: () => getTeacher(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetTeacherById = (id, options = {}) => {
  return useQuery({
    queryKey: ["teacher", id],
    queryFn: () => getTeacherById(id),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useCreateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeacher,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success(response?.message || "Teacher created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create teacher");
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTeacher(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", variables.id] });
      toast.success(response?.message || "Teacher updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update teacher");
    },
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeacher,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success(response?.message || "Teacher deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete teacher");
    },
  });
};
