import { getTeacherNotifications, markNotificationAsRead, getUnreadTeacherNotificationsCount } from "@/api/notificationApi";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

export const useGetTeacherNotifications = (filter, options = {}) => {
  return useQuery({
    queryKey: ["teacher-notifications", filter],
    queryFn: () => getTeacherNotifications(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: () => {
      // Invalidate both caches to refresh the UI immediately
      queryClient.invalidateQueries({ queryKey: ["teacher-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-notifications-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-notifications-unread"] });
    },
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
