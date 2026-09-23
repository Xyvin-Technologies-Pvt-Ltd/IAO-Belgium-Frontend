import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getExactStatus,
  getExactUnsynced,
  getExactSent,
  reconcileExact,
  reconcileExactPayment,
  backfillExactContacts,
  disconnectExact,
  getExactReconciliation,
  verifyExactReconciliation,
  resyncExactReconciliationRow,
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

export const useGetExactReconciliation = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["exact-reconciliation", params],
    queryFn: () => getExactReconciliation(params),
    staleTime: 30000,
    //* Keep the current rows on screen while paging/filtering instead of flashing empty.
    placeholderData: (previousData) => previousData,
    ...options,
  });

/**
 * Live Mollie + Exact check for specific rows. Read-only on the server, so there
 * is nothing to invalidate — the caller holds the verdicts in local state.
 */
export const useVerifyExactReconciliation = () =>
  useMutation({
    mutationFn: verifyExactReconciliation,
    onError: (err) =>
      toast.error(err?.message || "Failed to verify against Mollie and Exact"),
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

export const useReconcileExactPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reconcileExactPayment,
    onSuccess: (res) => {
      const uid = res?.data?.uid;
      toast.success(uid ? `Queued ${uid} for Exact Online` : "Payment queued for Exact Online");
      // The worker posts to Exact asynchronously, so the row only leaves Pending once
      // it has an entry id. Refetch now for the queue state, then again once the push
      // has realistically finished, so the result shows up without a manual reload.
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["exact-unsynced"] });
        queryClient.invalidateQueries({ queryKey: ["exact-sent"] });
      };
      refresh();
      setTimeout(refresh, 6000);
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to sync this payment to Exact Online"),
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

/**
 * Single-row conversion: reverse the old bare Sales Entry and repost it as a
 * real Sales Invoice + Document. No bulk variant — the accountant reviews and
 * clicks one row at a time, then watches it flip from Entry to Invoice.
 */
export const useResyncExactReconciliationRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resyncExactReconciliationRow,
    onSuccess: (res) => {
      const data = res?.data || {};
      if (data.skipped) {
        toast.info(res?.message || "Row already has an Exact invoice");
      } else {
        toast.success(
          data.invoice_number
            ? `Converted — Exact invoice ${data.invoice_number} created`
            : res?.message || "Converted to a Sales Invoice with a document",
        );
      }
      queryClient.invalidateQueries({ queryKey: ["exact-reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["exact-sent"] });
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to convert this row to an invoice"),
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
