import { getBatchById, getStudentByBatch, createBatch, deleteBatch, getBatchAttendance, getBatchExamResults, getBatchYearLog, recalculateYearCompletion } from "@/api/batchApi";
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
export const useGetStudentsByBatch = (id, options = {}) => {
  return useQuery({
    queryKey: ["students", "batch", id],
    queryFn: () => getStudentByBatch(id),
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
      toast.error(error?.message || "Failed to recalculate year completion");
    },
  });
};
