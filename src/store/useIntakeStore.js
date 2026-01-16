
import { createIntake, deleteIntake, getIntakes, updateintake } from "@/api/intakeApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetIntakes = (filter, options = {}) => {
  return useQuery({
    queryKey: ["intakes", filter],
    queryFn: () => getIntakes(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateIntake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIntake,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["intakes"] });
      toast.success(response?.message || "Intake created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create intake");
    },
  });
};

export const useUpdateIntake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateintake(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["intakes"] });
      queryClient.invalidateQueries({ queryKey: ["intake", variables.id] });
      toast.success(response?.message || "Intake updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update intake");
    },
  });
};

export const useDeleteIntake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteIntake,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["intakes"] });
      toast.success(response?.message || "Intake deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete intake");
    },
  });
};
