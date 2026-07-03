import {
  createProgram,
  deleteProgram,
  duplicateProgram,
  getProgramById,
  getPrograms,
  getProgramsForLogin,
  updateProgram,
  getProgramTypeConfigs,
  updateProgramTypeConfig,
} from "@/api/programApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetPrograms = (filter, options = {}) => {
  return useQuery({
    queryKey: ["programs", filter],
    queryFn: () => getPrograms(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetProgramById = (id, options = {}) => {
  return useQuery({
    queryKey: ["program", id],
    queryFn: () => getProgramById(id),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProgram,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success(response?.message || "Program created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create program");
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateProgram(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["program", variables.id] });
      toast.success(response?.message || "Program updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update program");
    },
  });
};

export const useDuplicateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateProgram,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success(response?.message || "Program duplicated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to duplicate program");
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProgram,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success(response?.message || "Program deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete program");
    },
  });
};
export const useGetProgramsList = (filter, options = {}) => {
  return useQuery({
    queryKey: ["programs-list", filter],
    queryFn: () => getProgramsForLogin(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetProgramTypeConfigs = (options = {}) => {
  return useQuery({
    queryKey: ["program-type-configs"],
    queryFn: getProgramTypeConfigs,
    staleTime: 30000,
    ...options,
  });
};

export const useUpdateProgramTypeConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProgramTypeConfig,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["program-type-configs"] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["program"] });
      toast.success(response?.message || "Program type configuration updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update program type configuration");
    },
  });
};
