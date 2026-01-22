
import { createTeacherRole, deleteTeacherRole, getTeacherRole, updateTeacherRole } from "@/api/teacherRoleApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetTeacherRole = (filter, options = {}) => {
  return useQuery({
    queryKey: ["teacher-roles", filter],
    queryFn: () => getTeacherRole(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateTeacherRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeacherRole,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-roles"] });
      toast.success(response?.message || "Role created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create role");
    },
  });
};

export const useUpdateTeacherRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTeacherRole(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-roles"] });
      toast.success(response?.message || "Role updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update role");
    },
  });
};

export const useDeleteTeacherRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeacherRole,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-roles"] });
      toast.success(response?.message || "Role deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete role");
    },
  });
};
