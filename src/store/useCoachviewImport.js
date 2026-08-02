import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCoachviewImportStatus,
  getCoachviewCohorts,
  previewCoachviewCohort,
  migrateCoachviewCohort,
} from "@/api/coachviewImportApi";

const COHORT_PAGE_SIZE = 100;

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

//* Server-paged cohort picker: search runs against the full archive, not the
//* already-loaded page. Each page asks for up to COHORT_PAGE_SIZE rows.
export const useInfiniteCoachviewCohorts = (filter = {}, options = {}) =>
  useInfiniteQuery({
    queryKey: ["coachview-cohorts-infinite", filter.search || "", filter.limit || COHORT_PAGE_SIZE],
    queryFn: ({ pageParam = 1 }) =>
      getCoachviewCohorts({
        search: filter.search || "",
        limit: filter.limit || COHORT_PAGE_SIZE,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, page) => acc + (page?.data?.length || 0), 0);
      const total = lastPage?.total_count ?? 0;
      return loaded < total ? allPages.length + 1 : undefined;
    },
    staleTime: 30000,
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
