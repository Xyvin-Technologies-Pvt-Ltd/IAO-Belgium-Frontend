import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveTeacherIdCard,
  getMyTeacherId,
  getTeacherIdCards,
  getTeacherIdUserActivity,
  getTeacherIdUserCard,
  issueTeacherIdCard,
  rejectTeacherIdCard,
  reissueTeacherIdCard,
  revokeTeacherIdCard,
  submitTeacherIdPhoto,
} from "@/api/teacherIdApi";

const apiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const useMyTeacherId = (options = {}) => {
  return useQuery({
    queryKey: ["myTeacherId"],
    queryFn: getMyTeacherId,
    ...options,
  });
};

export const useSubmitTeacherIdPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitTeacherIdPhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTeacherId"] });
      toast.success("Photo submitted for approval");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to submit photo"));
    },
  });
};

export const useTeacherIdCards = (params, options = {}) => {
  return useQuery({
    queryKey: ["teacherIdCards", params],
    queryFn: () => getTeacherIdCards(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useTeacherIdUserActivity = (userId, options = {}) => {
  return useQuery({
    queryKey: ["teacherIdUserActivity", userId],
    queryFn: () => getTeacherIdUserActivity(userId),
    enabled: Boolean(userId),
    ...options,
  });
};

export const useTeacherIdUserCard = (userId, options = {}) => {
  return useQuery({
    queryKey: ["teacherIdUserCard", userId],
    queryFn: () => getTeacherIdUserCard(userId),
    enabled: Boolean(userId),
    ...options,
  });
};

export const useApproveTeacherIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveTeacherIdCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherIdCards"] });
      queryClient.invalidateQueries({ queryKey: ["teacherIdUserActivity"] });
      toast.success("Card approved");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to approve card"));
    },
  });
};

export const useRejectTeacherIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => rejectTeacherIdCard(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherIdCards"] });
      queryClient.invalidateQueries({ queryKey: ["teacherIdUserActivity"] });
      toast.success("Card rejected");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to reject card"));
    },
  });
};

export const useRevokeTeacherIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => revokeTeacherIdCard(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherIdCards"] });
      queryClient.invalidateQueries({ queryKey: ["teacherIdUserActivity"] });
      toast.success("Card revoked");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to revoke card"));
    },
  });
};

export const useReissueTeacherIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, photo_key }) => reissueTeacherIdCard(id, photo_key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherIdCards"] });
      queryClient.invalidateQueries({ queryKey: ["teacherIdUserActivity"] });
      toast.success("Card reissued");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to reissue card"));
    },
  });
};

export const useIssueTeacherIdCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issueTeacherIdCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherIdCards"] });
      queryClient.invalidateQueries({ queryKey: ["teacherIdUserActivity"] });
      toast.success("Card issued");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to issue card"));
    },
  });
};
