import {
  getPayments,
  getAnalyticsByCity,
  getAnalyticsByCityList,
  getAnalyticsByProgram,
  getAnalyticsByProgramList,
  getAnalyticsByBatch,
  getAnalyticsByBatchList,
  getAnalyticsByStudent,
  createPayment,
  getTransactionLogs,
  getKmoApplications,
  updateKmoStatus,
} from "@/api/paymentApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetPayments = (filter, options = {}) => {
  return useQuery({
    queryKey: ["payments", filter],
    queryFn: () => getPayments(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetTransactionLogs = (filter, options = {}) => {
  return useQuery({
    queryKey: ["transaction-logs", filter],
    queryFn: () => getTransactionLogs(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAnalyticsByCity = (filter, options = {}) => {
  return useQuery({
    queryKey: ["payment-analytics-city", filter],
    queryFn: () => getAnalyticsByCity(filter),
    staleTime: 60000,
    ...options,
  });
};

export const useGetAnalyticsByCityList = (filter, options = {}) => {
  return useQuery({
    queryKey: ["payment-analytics-city-list", filter],
    queryFn: () => getAnalyticsByCityList(filter),
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
    retry: false,
    ...options,
  });
};

export const useGetAnalyticsByProgram = (filter, options = {}) => {
  return useQuery({
    queryKey: ["payment-analytics-program", filter],
    queryFn: () => getAnalyticsByProgram(filter),
    staleTime: 60000,
    ...options,
  });
};

export const useGetAnalyticsByProgramList = (filter, options = {}) => {
  return useQuery({
    queryKey: ["payment-analytics-program-list", filter],
    queryFn: () => getAnalyticsByProgramList(filter),
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
    retry: false,
    ...options,
  });
};

export const useGetAnalyticsByBatch = (filter, options = {}) => {
  return useQuery({
    queryKey: ["payment-analytics-batch", filter],
    queryFn: () => getAnalyticsByBatch(filter),
    staleTime: 60000,
    ...options,
  });
};

export const useGetAnalyticsByBatchList = (filter, options = {}) => {
  return useQuery({
    queryKey: ["payment-analytics-batch-list", filter],
    queryFn: () => getAnalyticsByBatchList(filter),
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetAnalyticsByStudent = (filter, options = {}) => {
  return useQuery({
    queryKey: ["payment-analytics-student", filter],
    queryFn: () => getAnalyticsByStudent(filter),
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      toast.success("Manual Invoice created!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create invoice");
    },
  });
};

export const useGetKmoApplications = (filter, options = {}) => {
  return useQuery({
    queryKey: ["kmo-applications", filter],
    queryFn: () => getKmoApplications(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useUpdateKmoStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateKmoStatus(id, data),
    onSuccess: () => {
      toast.success("KMO application status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["kmo-applications"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update KMO status");
    },
  });
};

export const useGetThirdPartyApplications = (filter, options = {}) => {
  return useQuery({
    queryKey: ["third-party-applications", filter],
    queryFn: () => import("@/api/paymentApi").then(m => m.getThirdPartyApplications(filter)),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useAdminCancelThirdParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => import("@/api/paymentApi").then(m => m.adminCancelThirdParty(id)),
    onSuccess: () => {
      toast.success("Third-party payment application cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: ["third-party-applications"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to cancel third-party payment application");
    },
  });
};
