import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFkfBulkInvoices,
  createFkfInvoice,
  getFkfBulkPreview,
  getFkfConfig,
  getFkfInvoices,
  getFkfModules,
  getFkfStudentModules,
  updateFkfConfig,
} from "@/api/fkfApi";
import { toast } from "sonner";

export const useGetFkfConfig = (options = {}) =>
  useQuery({
    queryKey: ["fkf-config"],
    queryFn: getFkfConfig,
    ...options,
  });

export const useUpdateFkfConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFkfConfig,
    onSuccess: () => {
      toast.success("Fachkursförderung config updated");
      queryClient.invalidateQueries({ queryKey: ["fkf-config"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update FKF config");
    },
  });
};

export const useGetFkfStudentModules = (studentId, options = {}) =>
  useQuery({
    queryKey: ["fkf-student-modules", studentId],
    queryFn: () => getFkfStudentModules(studentId),
    enabled: Boolean(studentId),
    ...options,
  });

export const useGetFkfModules = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["fkf-modules", params],
    queryFn: () => getFkfModules(params),
    enabled: Boolean(params?.program),
    ...options,
  });

export const useGetFkfBulkPreview = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["fkf-bulk-preview", params],
    queryFn: () => getFkfBulkPreview(params),
    enabled: Boolean(params?.batch && params?.component),
    ...options,
  });

export const useGetFkfInvoices = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["fkf-invoices", params],
    queryFn: () => getFkfInvoices(params),
    ...options,
  });

export const useCreateFkfInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFkfInvoice,
    onSuccess: (data) => {
      toast.success(
        data?.message || "FKF invoice created and email sent",
      );
      queryClient.invalidateQueries({ queryKey: ["fkf-student-modules"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-bulk-preview"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create FKF invoice");
    },
  });
};

export const useCreateFkfBulkInvoices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFkfBulkInvoices,
    onSuccess: (data) => {
      const payload = data?.data;
      toast.success(
        data?.message ||
          `FKF bulk send finished: ${payload?.success_count || 0} succeeded`,
      );
      if (payload?.failed_count > 0) {
        toast.warning(
          `${payload.failed_count} of ${payload.total} invoices failed`,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["fkf-bulk-preview"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-student-modules"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to bulk-create FKF invoices");
    },
  });
};
