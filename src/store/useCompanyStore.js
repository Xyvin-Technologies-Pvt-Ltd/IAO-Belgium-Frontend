import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUserCompanies, getCompany, updateCompany } from "@/api/companyApi";

export const useGetUserCompanies = (userId, options = {}) =>
  useQuery({
    queryKey: ["user-companies", userId],
    queryFn: () => getUserCompanies(userId),
    enabled: Boolean(userId),
    staleTime: 30000,
    ...options,
  });

export const useGetCompany = (companyId, options = {}) =>
  useQuery({
    queryKey: ["company", companyId],
    queryFn: () => getCompany(companyId),
    enabled: Boolean(companyId),
    staleTime: 0,
    ...options,
  });

/** Admin edit of a student's company. Refreshes every view that shows company data. */
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompany,
    onSuccess: (res, variables) => {
      toast.success(res?.message || "Company updated");
      for (const queryKey of [
        ["company", variables.id],
        ["user-companies"],
        ["exact-company-countries"],
        ["exact-to-send"],
        ["exact-to-send-preview"],
        ["student-profile-logs"],
      ]) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: (err) => toast.error(err?.message || "Failed to update the company"),
  });
};
