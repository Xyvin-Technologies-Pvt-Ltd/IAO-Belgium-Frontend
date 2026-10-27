import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  assignModuleReattempt,
  demoteYearCompletion,
  evaluateYearCompletion,
  getReattemptBatches,
  promoteYearCompletion,
} from "@/api/yearCompletionApi";

export const useEvaluateYearCompletion = () => {
  return useMutation({
    mutationFn: evaluateYearCompletion,
    onError: (error) => {
      toast.error(error?.message || "Failed to calculate year completion");
    },
  });
};

export const usePromoteYearCompletion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promoteYearCompletion,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["batch-year-log"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["enrolled-students"] });
      toast.success(response?.message || "Student promoted");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to promote student");
    },
  });
};

export const useDemoteYearCompletion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: demoteYearCompletion,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["batch-year-log"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["enrolled-students"] });
      toast.success(response?.message || "Student demoted");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to demote student");
    },
  });
};

export const useReattemptBatches = (applicationId, componentId, options = {}) => {
  return useQuery({
    queryKey: ["reattempt-batches", applicationId, componentId],
    queryFn: () => getReattemptBatches(applicationId, componentId),
    enabled: !!applicationId && !!componentId,
    ...options,
  });
};

export const useAssignModuleReattempt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignModuleReattempt,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["student"] });
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["enrolled-students"] });
      toast.success(response?.message || "Student assigned to group");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to assign group");
    },
  });
};
