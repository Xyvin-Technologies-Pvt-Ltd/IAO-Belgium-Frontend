import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getQueueSummaries,
  getQueueJobs,
  getQueueJob,
  removeQueueJob,
  bulkRemoveQueueJobs,
  retryQueueJob,
  cleanQueueJobs,
} from "@/api/queueApi";

export const QUEUE_NAMES = {
  email: "email_queue",
  exact: "exact_queue",
  contract: "contract_queue",
};

export const useQueueSummaries = (options = {}) =>
  useQuery({
    queryKey: ["queue-summaries"],
    queryFn: getQueueSummaries,
    staleTime: 10000,
    refetchInterval: 15000,
    ...options,
  });

export const useQueueJobs = (queueName, params = {}, options = {}) =>
  useQuery({
    queryKey: ["queue-jobs", queueName, params],
    queryFn: () => getQueueJobs(queueName, params),
    enabled: Boolean(queueName),
    staleTime: 10000,
    refetchInterval: 15000,
    ...options,
  });

export const useQueueJob = (queueName, jobId, options = {}) =>
  useQuery({
    queryKey: ["queue-job", queueName, jobId],
    queryFn: () => getQueueJob(queueName, jobId),
    enabled: Boolean(queueName && jobId),
    ...options,
  });

function invalidateQueueQueries(queryClient, queueName) {
  queryClient.invalidateQueries({ queryKey: ["queue-summaries"] });
  queryClient.invalidateQueries({ queryKey: ["queue-jobs", queueName] });
}

export const useRemoveQueueJob = (queueName) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId) => removeQueueJob(queueName, jobId),
    onSuccess: () => {
      toast.success("Job removed");
      invalidateQueueQueries(queryClient, queueName);
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to remove job"),
  });
};

export const useBulkRemoveQueueJobs = (queueName) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobIds) => bulkRemoveQueueJobs(queueName, jobIds),
    onSuccess: (res) => {
      const { removed = [], skipped_active = [] } = res?.data || {};
      const parts = [];
      if (removed.length > 0) parts.push(`${removed.length} removed`);
      if (skipped_active.length > 0) {
        parts.push(`${skipped_active.length} active skipped`);
      }
      toast.success(parts.length ? parts.join(", ") : "No jobs removed");
      invalidateQueueQueries(queryClient, queueName);
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to remove selected jobs"),
  });
};

export const useRetryQueueJob = (queueName) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId) => retryQueueJob(queueName, jobId),
    onSuccess: () => {
      toast.success("Job retried");
      invalidateQueueQueries(queryClient, queueName);
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to retry job"),
  });
};

export const useCleanQueueJobs = (queueName) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params) => cleanQueueJobs(queueName, params),
    onSuccess: (res) => {
      const count = res?.data?.removed_count ?? 0;
      toast.success(`Cleared ${count} failed job(s)`);
      invalidateQueueQueries(queryClient, queueName);
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to clear jobs"),
  });
};
