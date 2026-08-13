import { getBatchById, getStudentByBatch, createBatch, deleteBatch, getBatchAttendance, getBatchExamResults, getBatchYearLog, recalculateYearCompletion, getBatchRemovalImpact, removeStudentFromBatch } from "@/api/batchApi";
import { markStudentAsFailed, pauseEnrollment, stopEnrollment, resumeEnrollment } from "@/api/intakeApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetBatchesById = (id, options = {}) => {
  return useQuery({
    queryKey: ["batch", id],
    queryFn: () => getBatchById(id),
    staleTime: 30000,
    enabled: !!id,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useGetStudentsByBatch = (id,filter, options = {}) => {
  return useQuery({
    queryKey: ["students", "batch", id, filter],
    queryFn: () => getStudentByBatch(id,filter),
    staleTime: 30000,
    enabled: !!id,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBatch,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["intake"] });
      toast.success(response?.message || "Batch created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create batch");
    },
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBatch,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      toast.success(response?.message || "Batch deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete batch");
    },
  });
};

export const useGetBatchAttendance = (batchId, params = {}, options = {}) => {
  return useQuery({
    queryKey: ["batch-attendance", batchId, params],
    queryFn: () => getBatchAttendance(batchId, params),
    staleTime: 30000,
    enabled: !!batchId,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetBatchExamResults = (batchId, params = {}, options = {}) => {
  return useQuery({
    queryKey: ["batch-exam-results", batchId, params],
    queryFn: () => getBatchExamResults(batchId, params),
    staleTime: 30000,
    enabled: !!batchId,
    ...options,
  });
};
export const useGetBatchYearLog = (batchId, params = {}, options = {}) => {
  return useQuery({
    queryKey: ["batch-year-log", batchId, params],
    queryFn: () => getBatchYearLog(batchId, params),
    staleTime: 30000,
    enabled: !!batchId,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useRecalculateYearCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recalculateYearCompletion,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["batch-year-log"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(response?.message || "Year completion recalculated successfully!");
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["batch-year-log"] });
      toast.error(error?.message || "Failed to recalculate year completion");
    },
  });
};

export const useRemovalImpact = (batchId, applicationId, options = {}) => {
  return useQuery({
    queryKey: ["batch-removal-impact", batchId, applicationId],
    queryFn: () => getBatchRemovalImpact(batchId, applicationId),
    enabled: !!batchId && !!applicationId,
    ...options,
  });
};

export const useRemoveStudentFromBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ batchId, applicationId, ...payload }) =>
      removeStudentFromBatch(batchId, applicationId, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch", variables.batchId] });
      queryClient.invalidateQueries({ queryKey: ["students", "batch", variables.batchId] });
      queryClient.invalidateQueries({ queryKey: ["student-list"] });
      toast.success(response?.message || "Student removed from group successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to remove student from group");
    },
  });
};

const invalidateEnrollmentQueries = (queryClient, batchId) => {
  queryClient.invalidateQueries({ queryKey: ["batches"] });
  queryClient.invalidateQueries({ queryKey: ["enrollments"] });
  queryClient.invalidateQueries({ queryKey: ["students"] });
  queryClient.invalidateQueries({ queryKey: ["student-list"] });
  if (batchId) {
    queryClient.invalidateQueries({ queryKey: ["batch", batchId] });
    queryClient.invalidateQueries({ queryKey: ["students", "batch", batchId] });
  }
};

export const usePauseEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, reason }) =>
      pauseEnrollment(applicationId, { reason }),
    onSuccess: (response, variables) => {
      invalidateEnrollmentQueries(queryClient, variables.batchId);
      toast.success(response?.message || "Enrollment paused successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to pause enrollment");
    },
  });
};

export const useStopEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, reason }) =>
      stopEnrollment(applicationId, { reason }),
    onSuccess: (response, variables) => {
      invalidateEnrollmentQueries(queryClient, variables.batchId);
      toast.success(response?.message || "Enrollment stopped successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to stop enrollment");
    },
  });
};

export const useResumeEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, targetBatchId, reason }) =>
      resumeEnrollment(applicationId, {
        target_batch_id: targetBatchId,
        reason,
      }),
    onSuccess: (response, variables) => {
      invalidateEnrollmentQueries(queryClient, variables.batchId);
      queryClient.invalidateQueries({ queryKey: ["batches", "program"] });
      toast.success(response?.message || "Enrollment resumed successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to resume enrollment");
    },
  });
};

export const useMarkStudentAsFailed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, reason }) =>
      markStudentAsFailed(applicationId, { reason }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["batch-year-log"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      toast.success(response?.message || "Student marked as failed successfully!");
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["batch-year-log"] });
      toast.error(error?.message || "Failed to mark student as failed");
    },
  });
};
