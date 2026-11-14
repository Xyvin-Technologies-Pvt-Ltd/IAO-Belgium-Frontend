import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveStudentIdCard,
  getStudentIdApplicationActivity,
  getStudentIdCards,
  getStudentIdEligibility,
  issueStudentIdCard,
  rejectStudentIdCard,
  reissueStudentIdCard,
  revokeStudentIdCard,
  simulateYearlyReissue,
  updateStudentIdEligibility,
} from "@/api/studentIdApi";

export const useStudentIdCards = (params, options = {}) => {
  return useQuery({
    queryKey: ["studentIdCards", params],
    queryFn: () => getStudentIdCards(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useStudentIdEligibility = (options = {}) => {
  return useQuery({
    queryKey: ["studentIdEligibility"],
    queryFn: getStudentIdEligibility,
    ...options,
  });
};

export const useStudentIdApplicationActivity = (
  applicationId,
  options = {},
) => {
  return useQuery({
    queryKey: ["studentIdApplicationActivity", applicationId],
    queryFn: () => getStudentIdApplicationActivity(applicationId),
    enabled: Boolean(applicationId),
    ...options,
  });
};

export const useUpdateStudentIdEligibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStudentIdEligibility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentIdEligibility"] });
      toast.success("Programme eligibility updated");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update eligibility");
    },
  });
};

export const useApproveStudentIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveStudentIdCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentIdCards"] });
      queryClient.invalidateQueries({
        queryKey: ["studentIdApplicationActivity"],
      });
      toast.success("Card approved");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to approve card");
    },
  });
};

export const useRejectStudentIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => rejectStudentIdCard(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentIdCards"] });
      queryClient.invalidateQueries({
        queryKey: ["studentIdApplicationActivity"],
      });
      toast.success("Card rejected");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to reject card");
    },
  });
};

export const useRevokeStudentIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => revokeStudentIdCard(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentIdCards"] });
      queryClient.invalidateQueries({
        queryKey: ["studentIdApplicationActivity"],
      });
      toast.success("Card revoked");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to revoke card");
    },
  });
};

export const useReissueStudentIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, photo_key }) => reissueStudentIdCard(id, photo_key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentIdCards"] });
      queryClient.invalidateQueries({
        queryKey: ["studentIdApplicationActivity"],
      });
      toast.success("Card reissued");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to reissue card");
    },
  });
};

export const useIssueStudentIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issueStudentIdCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentIdCards"] });
      queryClient.invalidateQueries({
        queryKey: ["studentIdApplicationActivity"],
      });
      toast.success("Card issued");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to issue card");
    },
  });
};

export const useSimulateYearlyReissue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: simulateYearlyReissue,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["studentIdCards"] });
      queryClient.invalidateQueries({
        queryKey: ["studentIdApplicationActivity"],
      });
      const expired = response?.data?.expired_count ?? 0;
      const created = response?.data?.created_count ?? 0;
      toast.success(`Expired ${expired}, created ${created}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to run yearly reissue");
    },
  });
};
