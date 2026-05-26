import {
  getTeacherNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadTeacherNotificationsCount,
  getAdminNotifications,
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
  sendAdminNotification,
  previewNotificationCount,
  getNotificationRecipients,
  getNotificationById,
  createSavedAudience,
  getSavedAudiences,
  deleteSavedAudience,
} from "@/api/notificationApi";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetTeacherNotifications = (filter, options = {}) => {
  return useQuery({
    queryKey: ["teacher-notifications", filter],
    queryFn: () => getTeacherNotifications(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetUnreadTeacherNotificationsCount = (options = {}) => {
  return useQuery({
    queryKey: ["teacher-notifications-unread"],
    queryFn: () => getUnreadTeacherNotificationsCount(),
    staleTime: 30000,
    ...options,
  });
};

export const useInfiniteTeacherNotifications = (filter, options = {}) => {
  return useInfiniteQuery({
    queryKey: ["teacher-notifications-infinite", filter],
    queryFn: async ({ pageParam = 1 }) => {
      return getTeacherNotifications({ ...filter, page: pageParam, limit: 10 });
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentCount = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return currentCount < lastPage.total_count ? allPages.length + 1 : undefined;
    },
    ...options,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-notifications-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-notifications-unread"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to mark notification as read");
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-notifications-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-notifications-unread"] });
      toast.success(response?.message || "All notifications marked as read");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to mark all notifications as read");
    },
  });
};

// ─── Admin hooks ─────────────────────────────────────────────────────────────

export const useGetAdminNotifications = (params, options = {}) => {
  return useQuery({
    queryKey: ["admin-notifications", params],
    queryFn: () => getAdminNotifications(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateAdminNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminNotification,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success(response?.message || "Notification created successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create notification");
    },
  });
};

export const useUpdateAdminNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdminNotification(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success(response?.message || "Notification updated successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update notification");
    },
  });
};

export const useDeleteAdminNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminNotification,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success(response?.message || "Notification deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete notification");
    },
  });
};

export const useSendAdminNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendAdminNotification,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success(response?.message || "Notification sent successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to send notification");
    },
  });
};

export const usePreviewNotificationCount = () => {
  return useMutation({
    mutationFn: previewNotificationCount,
  });
};

export const useGetNotificationRecipients = (id, params, options = {}) => {
  return useQuery({
    queryKey: ["notification-recipients", id, params],
    queryFn: () => getNotificationRecipients(id, params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    enabled: !!id,
    ...options,
  });
};

export const useGetNotificationById = (id, options = {}) => {
  return useQuery({
    queryKey: ["notification", id],
    queryFn: () => getNotificationById(id),
    staleTime: 30000,
    enabled: !!id,
    ...options,
  });
};

export const useGetSavedAudiences = (options = {}) => {
  return useQuery({
    queryKey: ["saved-audiences"],
    queryFn: getSavedAudiences,
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateSavedAudience = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSavedAudience,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["saved-audiences"] });
      toast.success(response?.message || "Audience saved successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to save audience");
    },
  });
};

export const useDeleteSavedAudience = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSavedAudience,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["saved-audiences"] });
      toast.success(response?.message || "Audience deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete audience");
    },
  });
};
