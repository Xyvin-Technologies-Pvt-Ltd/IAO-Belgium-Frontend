import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getExactStatus,
  getExactUnsynced,
  reconcileExact,
  disconnectExact,
} from "@/api/exactApi";

export const useGetExactStatus = (options = {}) =>
  useQuery({
    queryKey: ["exact-status"],
    queryFn: getExactStatus,
    staleTime: 30000,
    ...options,
  });

export const useGetExactUnsynced = (options = {}) =>
  useQuery({
    queryKey: ["exact-unsynced"],
    queryFn: getExactUnsynced,
    staleTime: 30000,
    ...options,
  });

export const useReconcileExact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reconcileExact,
    onSuccess: (res) => {
      const { queued = 0, retried = 0, skipped = 0 } = res?.data || {};
      const parts = [];
      if (queued > 0) parts.push(`${queued} queued`);
      if (retried > 0) parts.push(`${retried} retried`);
      if (skipped > 0) parts.push(`${skipped} already in queue`);
      toast.success(
        parts.length
          ? `Sync started: ${parts.join(", ")}`
          : "All payments are already synced",
      );
      queryClient.invalidateQueries({ queryKey: ["exact-unsynced"] });
      queryClient.invalidateQueries({ queryKey: ["exact-status"] });
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to sync payments to Exact Online"),
  });
};

export const useDisconnectExact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectExact,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["exact-status"] });
      queryClient.invalidateQueries({ queryKey: ["exact-unsynced"] });
      toast.success(res?.message || "Exact Online disconnected");
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to disconnect Exact Online"),
  });
};
