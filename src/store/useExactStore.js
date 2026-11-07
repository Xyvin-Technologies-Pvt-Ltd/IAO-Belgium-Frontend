import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getExactStatus,
  getExactSent,
  backfillExactContacts,
  startMollieRefBackfill,
  getMollieRefBackfillStatus,
  disconnectExact,
  getExactReconciliation,
  verifyExactReconciliation,
  getExactSendMode,
  setExactSendMode,
  getExactToSend,
  getExactToSendPreview,
  sendExactJob,
  getExactDocumentTypes,
  getExactMissing,
  addExactToOutbox,
  getExactPayouts,
  getExactPayout,
  syncExactPayouts,
  getExactPayoutsSyncStatus,
  queueExactPayoutMissing,
  sendExactPayoutWaiting,
  getCompanyCountries,
  applyCompanyCountries,
  retryExactJobs,
} from "@/api/exactApi";

export const useGetExactStatus = (options = {}) =>
  useQuery({
    queryKey: ["exact-status"],
    queryFn: getExactStatus,
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

/** Polls every 3s while a Mollie reference backfill is running. */
export const useGetMollieRefBackfillStatus = (options = {}) =>
  useQuery({
    queryKey: ["exact-mollie-ref-backfill"],
    queryFn: getMollieRefBackfillStatus,
    refetchInterval: (query) =>
      query.state.data?.data?.state === "running" ? 3000 : false,
    ...options,
  });

export const useStartMollieRefBackfill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startMollieRefBackfill,
    onSuccess: (res) => {
      toast.success(res?.message || "Started");
      queryClient.invalidateQueries({ queryKey: ["exact-mollie-ref-backfill"] });
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to start the Mollie reference backfill"),
  });
};

// ─── Manual / automatic sending (Sales Entries) ──────────────────────────────

export const useGetExactSendMode = (options = {}) =>
  useQuery({
    queryKey: ["exact-send-mode"],
    queryFn: getExactSendMode,
    staleTime: 15000,
    ...options,
  });

export const useSetExactSendMode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setExactSendMode,
    onSuccess: (res) => {
      toast.success(res?.message || "Send mode saved");
      queryClient.invalidateQueries({ queryKey: ["exact-send-mode"] });
      queryClient.invalidateQueries({ queryKey: ["exact-to-send"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to change the send mode"),
  });
};

/** Held, failed and in-progress Exact jobs. Polls while anything is sending. */
export const useGetExactToSend = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["exact-to-send", params],
    queryFn: () => getExactToSend(params),
    staleTime: 5000,
    //* counts_all ignores the search/date filter, so a hidden "sending" row still refreshes.
    refetchInterval: (query) => {
      const counts = query.state.data?.counts_all ?? query.state.data?.counts;
      return counts?.sending ? 4000 : false;
    },
    ...options,
  });

export const useGetExactToSendPreview = (jobId, options = {}) =>
  useQuery({
    queryKey: ["exact-to-send-preview", jobId],
    queryFn: () => getExactToSendPreview(jobId),
    enabled: Boolean(jobId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    ...options,
  });

export const useSendExactJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendExactJob,
    onSuccess: () => {
      //* The worker posts asynchronously; refresh now and again shortly after.
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["exact-to-send"] });
        queryClient.invalidateQueries({ queryKey: ["exact-reconciliation"] });
        queryClient.invalidateQueries({ queryKey: ["exact-missing"] });
        queryClient.invalidateQueries({ queryKey: ["exact-sent"] });
      };
      refresh();
      setTimeout(refresh, 6000);
    },
    onError: (err) => toast.error(err?.message || "Failed to send this record to Exact"),
  });
};

/** Read-only PDF permission check; the caller shows the result. */
export const useCheckExactDocumentTypes = () =>
  useMutation({ mutationFn: getExactDocumentTypes });

export const useDisconnectExact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectExact,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["exact-status"] });
      queryClient.invalidateQueries({ queryKey: ["exact-missing"] });
      queryClient.invalidateQueries({ queryKey: ["exact-sent"] });
      toast.success(res?.message || "Exact Online disconnected");
    },
    onError: (err) =>
      toast.error(err?.message || "Failed to disconnect Exact Online"),
  });
};

// ─── To send → Missing ───────────────────────────────────────────────────────

/** Records that should be in Exact but aren't. count_only for the chip badge. */
export const useGetExactMissing = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["exact-missing", params],
    queryFn: () => getExactMissing(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });

/** Missing → "Add to To send". Only queues; the admin previews and sends it there. */
export const useAddExactToOutbox = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addExactToOutbox,
    onSuccess: (res) => {
      toast.success(res?.data?.uid ? `${res.data.uid}: ${res.message}` : res?.message || "Added to To send");
      queryClient.invalidateQueries({ queryKey: ["exact-missing"] });
      queryClient.invalidateQueries({ queryKey: ["exact-to-send"] });
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to add this record to To send");
      //* Already queued elsewhere: refresh so the row shows its To send state.
      queryClient.invalidateQueries({ queryKey: ["exact-missing"] });
    },
  });
};

// ─── Payouts (Mollie settlements ↔ Exact) ────────────────────────────────────

const PAYOUT_KEYS = [["exact-payouts"], ["exact-payout"], ["exact-to-send"], ["exact-missing"]];

function refreshPayouts(queryClient) {
  for (const queryKey of PAYOUT_KEYS) queryClient.invalidateQueries({ queryKey });
}

export const useGetExactPayouts = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["exact-payouts", params],
    queryFn: () => getExactPayouts(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });

export const useGetExactPayout = (settlementId, options = {}) =>
  useQuery({
    queryKey: ["exact-payout", settlementId],
    queryFn: () => getExactPayout(settlementId),
    enabled: Boolean(settlementId),
    staleTime: 10000,
    ...options,
  });

/** Polls every 3s while a refresh from Mollie is running. */
export const useGetExactPayoutsSyncStatus = (options = {}) =>
  useQuery({
    queryKey: ["exact-payouts-sync"],
    queryFn: getExactPayoutsSyncStatus,
    refetchInterval: (query) => (query.state.data?.data?.state === "running" ? 3000 : false),
    ...options,
  });

export const useSyncExactPayouts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncExactPayouts,
    onSuccess: (res) => {
      toast.success(res?.message || "Refreshing payouts from Mollie");
      queryClient.invalidateQueries({ queryKey: ["exact-payouts-sync"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to refresh payouts from Mollie"),
  });
};

export const useQueueExactPayoutMissing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: queueExactPayoutMissing,
    onSuccess: (res) => {
      toast.success(res?.message || "Added to To send");
      refreshPayouts(queryClient);
    },
    onError: (err) => toast.error(err?.message || "Failed to add this payout's records to To send"),
  });
};

export const useSendExactPayoutWaiting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendExactPayoutWaiting,
    onSuccess: (res) => {
      toast.success(res?.message || "Sent to Exact");
      //* The worker posts asynchronously; refresh now and again shortly after.
      refreshPayouts(queryClient);
      setTimeout(() => refreshPayouts(queryClient), 8000);
    },
    onError: (err) => toast.error(err?.message || "Failed to send this payout's records"),
  });
};

// ─── Company countries + bulk retry ──────────────────────────────────────────

export const useGetCompanyCountries = (options = {}) =>
  useQuery({
    queryKey: ["exact-company-countries"],
    queryFn: getCompanyCountries,
    staleTime: 30000,
    ...options,
  });

export const useApplyCompanyCountries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyCompanyCountries,
    onSuccess: (res) => {
      toast.success(res?.message || "Company countries fixed");
      queryClient.invalidateQueries({ queryKey: ["exact-company-countries"] });
      queryClient.invalidateQueries({ queryKey: ["user-companies"] });
      queryClient.invalidateQueries({ queryKey: ["exact-to-send-preview"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to fix company countries"),
  });
};

export const useRetryExactJobs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryExactJobs,
    onSuccess: (res) => {
      toast.success(res?.message || "Retried");
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["exact-to-send"] });
        queryClient.invalidateQueries({ queryKey: ["exact-payouts"] });
        queryClient.invalidateQueries({ queryKey: ["exact-payout"] });
      };
      refresh();
      setTimeout(refresh, 8000);
    },
    onError: (err) => toast.error(err?.message || "Failed to retry these records"),
  });
};
