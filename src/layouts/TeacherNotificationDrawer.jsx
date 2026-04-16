import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell } from "lucide-react";
import {
  useGetUnreadTeacherNotificationsCount,
  useInfiniteTeacherNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/store/useNotificationStore";
import moment from "moment";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const TeacherNotificationDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { data: badgeData } = useGetUnreadTeacherNotificationsCount({
    refetchInterval: 60000,
  });
  const unreadCount = badgeData?.data?.unread_count || 0;

  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTeacherNotifications({}, { enabled: isOpen });

  const notifications = infiniteData?.pages.flatMap((page) => page.data) || [];

  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead();

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    if (notification.meta?.submission_id) {
      setIsOpen(false);
      navigate({ to: `/teacher/evaluations/${notification.meta.submission_id}` });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-dashboard-text-secondary hover:text-dashboard-text focus:outline-none"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                background: "#ef4444",
                border: "2px solid var(--sidebar)",
                borderRadius: "50%",
                width: 10,
                height: 10,
              }}
            />
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[400px] sm:w-[480px] p-0 bg-sidebar flex flex-col h-full max-h-screen"
      >
        <SheetHeader
          className="p-6 pb-5 shrink-0"
          style={{ borderBottom: "1px solid var(--sidebar-border, #e8edf3)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255,137,4,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bell size={18} color="#ff8904" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-sidebar-foreground">
                  Notifications
                </SheetTitle>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                  Your recent updates and alerts
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50/30 px-2"
                onClick={() => markAllRead()}
                disabled={isMarkingAll}
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="p-0 flex-1 overflow-y-auto" onScroll={handleScroll}>
          {isLoading ? (
            <div className="p-6 text-center text-sm text-dashboard-text-secondary">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-dashboard-text-secondary">
              No notifications yet.
            </div>
          ) : (
            <div
              className="divide-y divide-sidebar-border"
              style={{ borderColor: "var(--sidebar-border, #e8edf3)" }}
            >
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-sidebar-accent cursor-pointer transition-colors relative flex gap-3 group ${
                    !notification.read ? "bg-orange-50/20 dark:bg-orange-950/20" : ""
                  }`}
                >
                  {!notification.read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {notification.subject && (
                      <p className={`text-sm font-semibold truncate ${
                        !notification.read ? "text-sidebar-foreground" : "text-dashboard-text-secondary"
                      }`}>
                        {notification.subject}
                      </p>
                    )}
                    <p
                      className={`text-sm ${
                        !notification.read
                          ? "font-medium text-sidebar-foreground"
                          : "text-dashboard-text-secondary"
                      } ${notification.subject ? "text-xs opacity-80 mt-0.5" : ""} prose prose-xs max-w-none`}
                      dangerouslySetInnerHTML={{ __html: notification.message }}
                    />
                    <p className="text-xs text-dashboard-text-secondary mt-1 opacity-70">
                      {moment(notification.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              ))}

              {isFetchingNextPage && (
                <div className="p-4 text-center text-xs text-dashboard-text-secondary">
                  Loading older notifications...
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>

    </Sheet>
  );
};

export default TeacherNotificationDrawer;
