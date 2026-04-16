import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Users, Calendar, Tag, Check, X } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const { t, i18n } = useTranslation();

  // Sync moment locale with app language
  useMemo(() => {
    moment.locale(i18n.language);
  }, [i18n.language]);

  if (!notification) return null;

  const getRecipientsLabel = () => {
    if (notification.meta?.module_id) {
      return `Module: ${notification.meta.module_name || notification.meta.module_id} (dynamic)`;
    }
    if (notification.type === "student_corner") return t("notification.view.selectedStudents");
    return t("notification.view.allUsers");
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
                {notification.subject || t("notification.view.title")}
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
              {t("notification.view.message")}
            </p>
            <p className="text-sm text-sidebar-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: notification.message }}
            />
          </div>

          {/* Meta */}
          <div className="rounded-xl border border-sidebar-border overflow-hidden">
            <div className="flex items-start gap-3 py-3 border-b border-sidebar-border">
              <div className="mt-0.5 p-1.5 rounded-md bg-sidebar-accent/40">
                <Users size={14} className="text-sidebar-foreground/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-sidebar-foreground/50 mb-0.5">
                  {t("notification.view.recipients")}
                </p>
                <p className="text-sm font-medium text-sidebar-foreground">
                  {getRecipientsLabel()}
                  {notification.recipient_count > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-sidebar-foreground/50">
                      ({notification.recipient_count})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <InfoRow
              icon={Tag}
              label={t("notification.view.type")}
              value={
                notification.type
                  ? notification.type === "student_corner"
                    ? "Student Corner"
                    : "Notification"
                  : t("notification.view.system")
              }
            />
            <InfoRow
              icon={Calendar}
              label={t("notification.view.created")}
              value={moment(notification.createdAt).format("MMM DD, YYYY · HH:mm")}
            />
            {notification.status === "sent" && notification.send_date && (
              <InfoRow
                icon={Calendar}
                label={t("notification.view.sentAt")}
                value={moment(notification.send_date).format("MMM DD, YYYY · HH:mm")}
              />
            )}
            {notification.expiry_date && (
              <InfoRow
                icon={Calendar}
                label="Expires"
                value={moment(notification.expiry_date).format("MMM DD, YYYY")}
              />
            )}
          </div>

          {/* Delivery Status Table */}
          {notification.recipient_users?.length > 0 && (
            <div className="border border-sidebar-border rounded-xl overflow-hidden mt-6">
              <div className="bg-sidebar-accent/30 p-3.5 border-b border-sidebar-border flex items-center justify-between">
                <h4 className="font-semibold text-sm text-sidebar-foreground">Delivery Status</h4>
              </div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-sidebar-accent/10 border-b border-sidebar-border sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                      <th className="px-5 py-3 font-medium text-sidebar-foreground/70 text-xs uppercase tracking-wider">Student</th>
                      <th className="px-5 py-3 font-medium text-sidebar-foreground/70 text-xs uppercase tracking-wider">Email</th>
                      <th className="px-5 py-3 font-medium text-sidebar-foreground/70 text-xs uppercase tracking-wider text-center w-24">Read</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sidebar-border/50">
                    {notification.recipient_users.map((u) => (
                      <tr key={u._id} className="hover:bg-sidebar-accent/20 transition-colors">
                        <td className="px-5 py-3 font-medium text-sidebar-foreground">{u.name}</td>
                        <td className="px-5 py-3 text-sidebar-foreground/70">{u.email || "—"}</td>
                        <td className="px-5 py-3 text-center">
                          {u.is_read || u.read ? (
                            <Check size={16} className="text-green-500 mx-auto" />
                          ) : (
                            <X size={16} className="text-gray-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationViewDrawer;
