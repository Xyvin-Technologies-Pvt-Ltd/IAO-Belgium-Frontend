import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Users, Calendar, Tag } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-sidebar-border last:border-0">
    <div className="mt-0.5 p-1.5 rounded-md bg-sidebar-accent/40">
      <Icon size={14} className="text-sidebar-foreground/60" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-sidebar-foreground/50 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-sidebar-foreground">{value}</p>
    </div>
  </div>
);

const NotificationViewDrawer = ({ open, onClose, notification }) => {
  if (!notification) return null;

  const getRecipientsLabel = () => {
    if (notification.target_role === "all" || (notification.is_all && !notification.target_role)) return "All Users";
    if (notification.is_all) {
      if (notification.target_role === "teacher") return "All Teachers";
      if (notification.target_role === "student") return "All Students";
    }
    if (notification.target_role === "teacher") return "Selected Teachers";
    if (notification.target_role === "student") return "Selected Students";
    return "Selected Users";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-sidebar border-sidebar-border w-[480px] max-w-[95vw] p-0 gap-0 flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 pb-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Bell size={18} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-sidebar-foreground truncate">
                {notification.subject || "Notification Details"}
              </DialogTitle>
              <div className="mt-1">
                <StatusBadge status={notification.status} />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Message */}
          <div className="rounded-xl bg-sidebar-accent/30 border border-sidebar-border p-4">
            <p className="text-xs text-sidebar-foreground/50 mb-2 font-medium uppercase tracking-wide">
              Message
            </p>
            <p className="text-sm text-sidebar-foreground leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Meta */}
          <div className="rounded-xl border border-sidebar-border overflow-hidden">
            <div className="flex items-start gap-3 py-3 border-b border-sidebar-border">
              <div className="mt-0.5 p-1.5 rounded-md bg-sidebar-accent/40">
                <Users size={14} className="text-sidebar-foreground/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-sidebar-foreground/50 mb-0.5">Recipients</p>
                <p className="text-sm font-medium text-sidebar-foreground">
                  {getRecipientsLabel()}
                  {notification.recipient_count > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-sidebar-foreground/50">
                      ({notification.recipient_count})
                    </span>
                  )}
                </p>
                {notification.recipient_users?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                    {notification.recipient_users.map((u) => (
                      <span
                        key={u._id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sidebar-accent border border-sidebar-border text-sidebar-foreground/80"
                      >
                        {u.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <InfoRow
              icon={Tag}
              label="Type"
              value={
                notification.type?.length
                  ? notification.type.map((t) => t === "in-app" ? "In-App" : "Email").join(", ")
                  : "System"
              }
            />
            <InfoRow
              icon={Calendar}
              label="Created"
              value={moment(notification.createdAt).format("MMM DD, YYYY · HH:mm")}
            />
            {notification.status === "sent" && notification.send_date && (
              <InfoRow
                icon={Calendar}
                label="Sent At"
                value={moment(notification.send_date).format("MMM DD, YYYY · HH:mm")}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationViewDrawer;
