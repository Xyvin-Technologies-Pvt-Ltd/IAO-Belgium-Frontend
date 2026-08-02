import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCoachviewImportStatus,
  getCoachviewCohorts,
  previewCoachviewCohort,
  migrateCoachviewCohort,
} from "@/api/coachviewImportApi";

export const useCoachviewImportStatus = (options = {}) =>
  useQuery({
    queryKey: ["coachview-import-status"],
    queryFn: getCoachviewImportStatus,
    staleTime: 60000,
    ...options,
  });

export const useCoachviewCohorts = (filter = {}, options = {}) =>
  useQuery({
    queryKey: ["coachview-cohorts", filter],
    queryFn: () => getCoachviewCohorts(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });

export const usePreviewCoachviewCohort = () =>
  useMutation({
    mutationFn: ({ opleidingId, batchId }) => previewCoachviewCohort(opleidingId, batchId),
    onError: (error) => {
      toast.error(error?.message || "Failed to load preview");
    },
  });

export const useMigrateCoachviewCohort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ batchId, ...payload }) => migrateCoachviewCohort(batchId, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch", variables.batchId] });
      queryClient.invalidateQueries({ queryKey: ["students", "batch", variables.batchId] });
      queryClient.invalidateQueries({ queryKey: ["student-list"] });
      const imported = response?.data?.imported ?? 0;
      if (imported > 0) {
        toast.success(response?.message || `${imported} student(s) migrated successfully!`);
      } else {
        toast.info(response?.message || "No new students to migrate.");
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to migrate cohort");
    },
  });
};
