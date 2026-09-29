import {
  getGlobalDefaults,
  updateGlobalDefaults,
  getProformaRegions,
  createProformaRegion,
  updateProformaRegion,
  deleteProformaRegion,
  getFinanceQueue,
  getProformaErrors,
  getProformaById,
  signProforma,
  addMiscellaneousClaim,
  updateProformaStatus,
  updateSectionApproval,
  addSectionComment,
  updateSectionItems,
  addSectionAttachment,
  submitTeacherUpdate,
  sendBackToTeacher,
  triggerPlanningProformaTest,
} from "@/api/proformaApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetGlobalDefaults = (options = {}) => {
  return useQuery({
    queryKey: ["proforma-global-defaults"],
    queryFn: getGlobalDefaults,
    staleTime: 30000,
    ...options,
  });
};

export const useUpdateGlobalDefaults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGlobalDefaults,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-global-defaults"] });
      toast.success(response?.message || "Global defaults updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update global defaults");
    },
  });
};

export const useGetProformaRegions = (options = {}) => {
  return useQuery({
    queryKey: ["proforma-regions"],
    queryFn: getProformaRegions,
    staleTime: 30000,
    ...options,
  });
};

export const useCreateProformaRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProformaRegion,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-regions"] });
      toast.success(response?.message || "Proforma region created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create proforma region");
    },
  });
};

export const useUpdateProformaRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateProformaRegion({ id, data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-regions"] });
      toast.success(response?.message || "Proforma region updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update proforma region");
    },
  });
};

export const useDeleteProformaRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProformaRegion,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-regions"] });
      toast.success(response?.message || "Proforma region deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete proforma region");
    },
  });
};

export const useGetFinanceQueue = (filter, options = {}) => {
  return useQuery({
    queryKey: ["proforma-finance-queue", filter],
    queryFn: () => getFinanceQueue(filter),
    staleTime: 0,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetProformaErrors = (filter, options = {}) => {
  return useQuery({
    queryKey: ["proforma-errors", filter],
    queryFn: () => getProformaErrors(filter),
    staleTime: 0,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetProformaById = (id, options = {}) => {
  return useQuery({
    queryKey: ["proforma-invoice", id],
    queryFn: () => getProformaById(id),
    staleTime: 30000,
    enabled: !!id,
    ...options,
  });
};

export const useSignProforma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => signProforma({ id, data }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-invoice", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["proforma-finance-queue"] });
      toast.success(response?.message || "Invoice digitally signed and approved successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to sign proforma invoice");
    },
  });
};

export const useAddMiscellaneousClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => addMiscellaneousClaim({ id, data }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-invoice", variables.id] });
      toast.success(response?.message || "Miscellaneous claim added successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to add claim");
    },
  });
};

export const useUpdateProformaStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateProformaStatus({ id, data }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-invoice", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["proforma-finance-queue"] });
      toast.success(response?.message || "Invoice status updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update proforma status");
    },
  });
};

export const useUpdateSectionApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, section, status, action, notes }) => updateSectionApproval({ id, section, status, action, notes }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-invoice", variables.id] });
      toast.success(response?.message || `Section ${variables.section} updated successfully!`);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update section approval");
    },
  });
};

export const useAddSectionComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, section, comment }) => addSectionComment({ id, section, comment }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-invoice", variables.id] });
      toast.success(response?.message || "Comment added successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to add comment");
    },
  });
};

export const useUpdateSectionItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, section, items }) => updateSectionItems({ id, section, items }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-invoice", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["proforma-finance-queue"] });
      toast.success(response?.message || `Section ${variables.section} updated & audit log saved!`);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update section items");
    },
  });
};

export const useAddSectionAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, section, files, file_name, file_url, file_type }) =>
      addSectionAttachment({ id, section, files, file_name, file_url, file_type }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-invoice", variables.id] });
      toast.success(response?.message || "Document attached successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to attach document");
    },
  });
};

export const useSubmitTeacherUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => submitTeacherUpdate({ id, data }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-invoice", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["proforma-finance-queue"] });
      toast.success(response?.message || "Update submitted for admin review!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to submit update");
    },
  });
};

export const useSendBackToTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => sendBackToTeacher({ id, data }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-invoice", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["proforma-finance-queue"] });
      toast.success(response?.message || "Sent back to teacher!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to send back to teacher");
    },
  });
};

export const useTriggerPlanningProformaTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planning_id) => triggerPlanningProformaTest(planning_id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["proforma-finance-queue"] });
      queryClient.invalidateQueries({ queryKey: ["proforma-errors"] });
      toast.success(response?.message || "Invoice calculation re-run successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to re-run invoice calculation");
    },
  });
};
