import {
  getPayments,
  getAnalyticsByCity,
  getAnalyticsByProgram,
  getAnalyticsByBatch,
  getAnalyticsByBatchList,
  getAnalyticsByStudent,
  createPayment,
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

export const useGetAnalyticsByCity = (filter, options = {}) => {
  return useQuery({
    queryKey: ["payment-analytics-city", filter],
    queryFn: () => getAnalyticsByCity(filter),
    staleTime: 60000,
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
