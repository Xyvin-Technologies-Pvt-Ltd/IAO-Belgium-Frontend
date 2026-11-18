import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveStudentIdCard,
  getStudentIdApplicationActivity,
  getStudentIdApplicationCard,
  getStudentIdCards,
  getStudentIdEligibility,
  issueStudentIdCard,
  rejectStudentIdCard,
  reissueStudentIdCard,
  revokeStudentIdCard,
  updateStudentIdEligibility,
} from "@/api/studentIdApi";

const apiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

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

export const useStudentIdApplicationCard = (
  applicationId,
  options = {},
) => {
  return useQuery({
    queryKey: ["studentIdApplicationCard", applicationId],
    queryFn: () => getStudentIdApplicationCard(applicationId),
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
      toast.error(apiErrorMessage(error, "Failed to update eligibility"));
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
      toast.error(apiErrorMessage(error, "Failed to approve card"));
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
      toast.error(apiErrorMessage(error, "Failed to reject card"));
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
      toast.error(apiErrorMessage(error, "Failed to revoke card"));
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
      toast.error(apiErrorMessage(error, "Failed to reissue card"));
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
      toast.error(apiErrorMessage(error, "Failed to issue card"));
    },
  });
};
