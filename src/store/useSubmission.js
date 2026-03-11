import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubmissions, bulkAssignTeacher, getTeacherSubmissions, evaluateSubmission, getSubmissionById, bulkEnableResubmission } from "@/api/submissionApi";
import { toast } from "sonner";

export const useGetSubmissions = (filters) => {
  return useQuery({
    queryKey: ["submissions", filters],
    queryFn: () => getSubmissions(filters),
    keepPreviousData: true,
  });
};

export const useBulkAssignTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkAssignTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries(["submissions"]);
    },
  });
};

export const useGetTeacherSubmissions = (filters) => {
  return useQuery({
    queryKey: ["teacher-submissions", filters],
    queryFn: () => getTeacherSubmissions(filters),
    keepPreviousData: true,
  });
};

export const useEvaluateSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => evaluateSubmission(id, data),
    onSuccess: (response, variables) => {
      toast.success(response?.message || "Submission evaluated successfully!");
      queryClient.invalidateQueries({ 
        queryKey: ["submission", variables.id],
        exact: true 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["teacher-submissions"]
      });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to evaluate submission");
    },
  });
};

export const useGetSubmissionById = (id, options = {}) => {
  return useQuery({
    queryKey: ["submission", id],
    queryFn: () => getSubmissionById(id),
    enabled: !!id,
    retry: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    ...options
  });
};

export const useBulkEnableResubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkEnableResubmission,
    onSuccess: () => {
      queryClient.invalidateQueries(["submissions"]);
    },
  });
};

