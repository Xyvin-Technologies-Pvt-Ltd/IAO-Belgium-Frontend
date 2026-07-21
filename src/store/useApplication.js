import { getApplications, updateApplication, putApplication, getModuleSelection, updateModuleSelection } from "@/api/applicationApi";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetApplications = (filter) => {
  return useQuery({
    queryKey: ["applications", filter],
    queryFn: () => getApplications(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateApplication(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(response?.message || "Application updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update application");
    },
  });
};

export const usePutApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => putApplication(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["student"] });
      toast.success(response?.message || "Application documents updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update application documents");
    },
  });
};

export const useGetModuleSelection = (id, options = {}) => {
  return useQuery({
    queryKey: ["moduleSelection", id],
    queryFn: () => getModuleSelection(id),
    staleTime: 5000,
    enabled: !!id,
    ...options,
  });
};

export const useUpdateModuleSelection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, selectedModules }) => updateModuleSelection(id, selectedModules),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["moduleSelection", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["intake-enrollments"] });
      toast.success(response?.message || "Module selection updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update module selection");
    },
  });
};
