import {
  createProgramConfig,
  deleteProgramConfig,
  getProgramConfigs,
  updateProgramConfig,
} from "@/api/programConfigApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetProgramConfigs = (filter, options = {}) => {
  return useQuery({
    queryKey: ["program-configs", filter],
    queryFn: () => getProgramConfigs(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateProgramConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProgramConfig,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["program-configs"] });
      toast.success(response?.message || "Program config created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create program config");
    },
  });
};

export const useUpdateProgramConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateProgramConfig(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["program-configs"] });
      queryClient.invalidateQueries({
        queryKey: ["program-config", variables.id],
      });
      toast.success(response?.message || "Program config updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update program config");
    },
  });
};

export const useDeleteProgramConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProgramConfig,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["program-configs"] });
      toast.success(response?.message || "Program config deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete program config");
    },
  });
};
