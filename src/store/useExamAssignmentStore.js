import {
  getExamAssignments,
  getExamAssignmentById,
  createExamAssignment,
  updateExamAssignment,
  cancelExamAssignment,
  getAssignmentResults,
  getAttemptDetail,
  exportResultsCsv,
} from "@/api/examAssignmentApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetExamAssignments = (params, options = {}) => {
  return useQuery({
    queryKey: ["exam-assignments", params],
    queryFn: () => getExamAssignments(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetExamAssignmentById = (id, options = {}) => {
  return useQuery({
    queryKey: ["exam-assignment", id],
    queryFn: () => getExamAssignmentById(id),
    enabled: !!id,
    staleTime: 30000,
    ...options,
  });
};

export const useCreateExamAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExamAssignment,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["exam-assignments"] });
      toast.success(response?.message || "Assignment created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create assignment");
    },
  });
};

export const useUpdateExamAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateExamAssignment(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exam-assignments"] });
      queryClient.invalidateQueries({
        queryKey: ["exam-assignment", variables.id],
      });
      toast.success(response?.message || "Assignment updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update assignment");
    },
  });
};

export const useCancelExamAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelExamAssignment,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exam-assignments"] });
      queryClient.invalidateQueries({
        queryKey: ["exam-assignment", variables],
      });
      toast.success(response?.message || "Assignment cancelled successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to cancel assignment");
    },
  });
};

export const useGetAssignmentResults = (id, params, options = {}) => {
  return useQuery({
    queryKey: ["exam-assignment-results", id, params],
    queryFn: () => getAssignmentResults(id, params),
    enabled: !!id,
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAttemptDetail = (assignmentId, attemptId, options = {}) => {
  return useQuery({
    queryKey: ["exam-attempt", assignmentId, attemptId],
    queryFn: () => getAttemptDetail(assignmentId, attemptId),
    enabled: !!assignmentId && !!attemptId,
    staleTime: 30000,
    ...options,
  });
};
