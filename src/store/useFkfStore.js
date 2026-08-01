import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFkfInvoice,
  getFkfConfig,
  getFkfInvoices,
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
        data?.message || "FKF invoice created and payment link sent",
      );
      queryClient.invalidateQueries({ queryKey: ["fkf-student-modules"] });
      queryClient.invalidateQueries({ queryKey: ["fkf-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create FKF invoice");
    },
  });
};
