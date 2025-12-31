import {
  createProgram,
  deleteProgram,
  getProgramById,
  getPrograms,
  updateProgram,
} from "@/api/programApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetPrograms = (filter) => {
  return useQuery({
    queryKey: ["programs", filter],
    queryFn: () => getPrograms(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useProgramById = (id) => {
  return useQuery({
    queryKey: ["program", id],
    queryFn: () => getProgramById(id),
    enabled: !!id,
    staleTime: 60000,
  });
};

export const useCreateProgram = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProgram,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create program");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useUpdateProgram = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateProgram(id, data),
    onSuccess: (responseData, variables) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["program", variables.id] });
      if (options.onSuccess) {
        options.onSuccess(responseData);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update program");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
};
