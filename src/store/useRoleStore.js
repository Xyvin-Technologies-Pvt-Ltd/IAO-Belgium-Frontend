import { createRole, deleteRole, getRoles, updateRole } from "@/api/roleApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetRoles = (filter, options = {}) => {
  return useQuery({
    queryKey: ["roles", filter],
    queryFn: () => getRoles(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(response?.message || "Role created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create role");
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateRole(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", variables.id] });
      toast.success(response?.message || "Role updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update role");
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(response?.message || "Role deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete role");
    },
  });
};
