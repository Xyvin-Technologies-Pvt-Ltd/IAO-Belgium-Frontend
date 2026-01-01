
import { createRole, deleteRole, getRoleById, getRoles, updateRole } from "@/api/roleApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetRoles = (filter) => {
  return useQuery({
    queryKey: ["roles", filter],
    queryFn: () => getRoles(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useRoleById = (id) => {
  return useQuery({
    queryKey: ["role", id],
    queryFn: () => getRoleById(id),
    enabled: !!id,
    staleTime: 60000,
  });
};

export const useCreateRole = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create role");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useUpdateRole = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateRole(id, data),
    onSuccess: (responseData, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", variables.id] });
      if (options.onSuccess) {
        options.onSuccess(responseData);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update role");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};
