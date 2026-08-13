import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFkfBulkInvoices,
  createFkfInvoice,
  cancelFkfInvoice,
  exportFkfStudents,
  getFkfConfig,
  getFkfEligibleStudents,
  getFkfInvoices,
  getFkfModules,
  getFkfStudentModules,
  getFkfStudents,
  markFkfEligible,
  previewFkfBulkInvoices,
  unmarkFkfEligible,
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

export const useGetFkfStudents = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["fkf-students", params],
    queryFn: () => getFkfStudents(params),
    ...options,
  });

export const useGetFkfEligibleStudents = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["fkf-eligible-students", params],
    queryFn: () => getFkfEligibleStudents(params),
    ...options,
  });

export const useMarkFkfEligible = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markFkfEligible,
    onSuccess: (data) => {
      toast.success(data?.message || "Students marked eligible");
      queryClient.invalidateQueries({ queryKey: ["fkf-students"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-eligible-students"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to mark students eligible");
    },
  });
};

export const useUnmarkFkfEligible = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unmarkFkfEligible,
    onSuccess: (data) => {
      toast.success(data?.message || "Students unmarked");
      queryClient.invalidateQueries({ queryKey: ["fkf-students"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-eligible-students"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to unmark students");
    },
  });
};

export const useExportFkfStudents = () =>
  useMutation({
    mutationFn: exportFkfStudents,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fkf-students.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exported");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to export students");
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["fkf-eligible-students"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create FKF invoice");
    },
  });
};

export const useCancelFkfInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId) => cancelFkfInvoice(paymentId),
    onSuccess: (data) => {
      toast.success(data?.message || "FKF subsidy cancelled");
      queryClient.invalidateQueries({ queryKey: ["fkf-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-eligible-students"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-student-modules"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to cancel FKF subsidy");
    },
  });
};

export const usePreviewFkfBulkInvoices = () =>
  useMutation({
    mutationFn: previewFkfBulkInvoices,
    onError: (error) => {
      toast.error(error?.message || "Failed to preview FKF invoices");
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["fkf-eligible-students"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-student-modules"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to bulk-create FKF invoices");
    },
  });
};
