import {
  createAdmin,
  deleteAdmin,
  getAdmins,
  updateAdmin,
  updateAdminStatus,
  bulkDeleteAdmins,
} from "@/api/adminApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetAdmins = (filter) => {
  return useQuery({
    queryKey: ["admins", filter],
    queryFn: () => getAdmins(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdmin,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success(response?.message || "Admin created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create admin");
    },
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateAdmin(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin", variables.id] });
      toast.success(response?.message || "Admin updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update admin");
    },
  });
};

export const useUpdateAdminStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => updateAdminStatus(id, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success(response?.message || "Admin status updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update admin status");
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdmin,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success(response?.message || "Admin deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete admin");
    },
  });
};

export const useBulkDeleteAdmins = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteAdmins,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success(response?.message || "Admins deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete admins");
    },
  });
};
