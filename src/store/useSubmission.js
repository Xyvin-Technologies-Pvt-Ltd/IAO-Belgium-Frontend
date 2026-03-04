import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubmissions, bulkAssignTeacher, getTeacherSubmissions, evaluateSubmission, getSubmissionById, bulkEnableResubmission } from "@/api/submissionApi";

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
    onSuccess: () => {
      queryClient.invalidateQueries(["teacher-submissions"]);
      queryClient.invalidateQueries(["submissions"]);
      queryClient.invalidateQueries(["submission"]);
    },
  });
};

export const useGetSubmissionById = (id, options = {}) => {
  return useQuery({
    queryKey: ["submission", id],
    queryFn: () => getSubmissionById(id),
    enabled: !!id,
    retry: false,
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

