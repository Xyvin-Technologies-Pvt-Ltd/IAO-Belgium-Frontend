import {
  createAcademic,
  duplicateAcademic,
  getAcademics,
  updateAcademic,
} from "@/api/academicApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetAcademic = (filter, options = {}) => {
  return useQuery({
    queryKey: ["academics", filter],
    queryFn: () => getAcademics(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateAcademic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAcademic,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["academics"] });
      toast.success(response?.message || "Academic created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create academic");
    },
  });
};

export const useUpdateAcademic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateAcademic(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["academics"] });
      toast.success(response?.message || "Academic updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update academic");
    },
  });
};

export const useDuplicateAcademic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) =>duplicateAcademic(id),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["academics"] });
      toast.success(response?.message || "Academic duplicated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to duplicate academic");
    },
  });
};
