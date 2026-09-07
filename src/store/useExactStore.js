import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getExactStatus,
  getExactUnsynced,
  getExactSent,
  reconcileExact,
  backfillExactContacts,
  disconnectExact,
} from "@/api/exactApi";

export const useGetExactStatus = (options = {}) =>
  useQuery({
    queryKey: ["exact-status"],
    queryFn: getExactStatus,
    staleTime: 30000,
    ...options,
  });

export const useGetExactUnsynced = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["exact-unsynced", params],
    queryFn: () => getExactUnsynced(params),
    staleTime: 30000,
    ...options,
  });

export const useGetExactSent = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["exact-sent", params],
    queryFn: () => getExactSent(params),
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
      queryClient.invalidateQueries({ queryKey: ["exact-sent"] });
      queryClient.invalidateQueries({ queryKey: ["exact-status"] });
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to sync payments to Exact Online"),
  });
};

export const useBackfillExactContacts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: backfillExactContacts,
    onSuccess: (res) => {
      const data = res?.data || {};
      const contacts = data.contacts || data;
      const yourRef = data.your_ref || {};

      const contactParts = [
        `${contacts.created ?? 0} contacts created`,
        `${contacts.existing ?? 0} existing`,
        `${contacts.failed ?? 0} failed`,
        `${contacts.skipped ?? 0} skipped`,
      ];
      const refParts = [
        `${yourRef.updated ?? 0} your ref updated`,
        `${yourRef.skipped ?? 0} skipped`,
        `${yourRef.failed ?? 0} failed`,
      ];

      toast.success(
        res?.message
          ? `${res.message}. Contacts: ${contactParts.join(", ")}. YourRef: ${refParts.join(", ")}`
          : `Backfill done. Contacts: ${contactParts.join(", ")}. YourRef: ${refParts.join(", ")}`,
      );
      queryClient.invalidateQueries({ queryKey: ["exact-sent"] });
      queryClient.invalidateQueries({ queryKey: ["exact-status"] });
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to backfill Exact contacts & your ref"),
  });
};

export const useDisconnectExact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectExact,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["exact-status"] });
      queryClient.invalidateQueries({ queryKey: ["exact-unsynced"] });
      queryClient.invalidateQueries({ queryKey: ["exact-sent"] });
      toast.success(res?.message || "Exact Online disconnected");
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to disconnect Exact Online"),
  });
};
