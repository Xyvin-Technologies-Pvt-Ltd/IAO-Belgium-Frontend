import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { Bell, Calendar, Tag, Check, X, Paperclip, File } from "lucide-react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/table/Pagination";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import {
  useGetNotificationById,
  useGetNotificationRecipients,
} from "@/store/useNotificationStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";

const NotificationDetail = () => {
  const { id } = useParams({ strict: false });
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: notifData, isLoading: notifLoading } = useGetNotificationById(id);
  const notification = notifData?.data;

  useEffect(() => {
    if (notification) {
      updateBreadcrumbs([
        {
          label: "Notification Management",
          path: "/admin/notification-management",
          navigable: true,
        },
        {
          label: notification.subject || "Notification Detail",
          path: `/admin/notification-management/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [notification?.subject, id]);

  const {
    data: recipientsData,
    isLoading: recipientsLoading,
    error: recipientsError,
    refetch,
    isFetching,
  } = useGetNotificationRecipients(id, {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const recipients = recipientsData?.data || [];
  const totalRows = recipientsData?.total_count || 0;

  useEffect(() => {
    if (notification?.message) {
      console.log("Debug - Raw Notification Message:", notification.message);
      // Attempt to encode spaces in image URLs to see if it fixes the broken image
      const processedMsg = notification.message.replace(/src="([^"]+)"/g, (match, p1) => {
        console.log("Debug - Found image src:", p1);
        console.log("Debug - Encoded image src:", encodeURI(p1));
        return `src="${encodeURI(p1)}"`;
      });
      console.log("Debug - Processed Notification Message:", processedMsg);
    }
  }, [notification?.message]);

  return (
    <div className="space-y-6 mt-4">
      {notifLoading ? (
        <div className="h-40 rounded-xl bg-sidebar-accent/20 animate-pulse" />
      ) : notification ? (
        <div className="space-y-6">
          {/* Info card — full width row */}
          <div className="rounded-xl border border-sidebar-border bg-sidebar p-5 space-y-4">
            {/* Title + status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Bell size={18} className="text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sidebar-foreground truncate">
                  {notification.subject || t("notification.view.title")}
                </p>
                <div className="mt-1">
                  <StatusBadge status={notification.status} />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="rounded-xl bg-sidebar-accent/30 border border-sidebar-border p-4">
              <p className="text-xs text-sidebar-foreground/50 mb-2 font-medium uppercase tracking-wide">
                {t("notification.view.message")}
              </p>
              <div className="text-sm text-sidebar-foreground leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_img]:max-w-[300px] [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2"
              dangerouslySetInnerHTML={{ __html: notification.message?.replace(/src="([^"]+)"/g, (match, p1) => `src="${encodeURI(p1)}"`) }}
            />
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                <Tag size={13} className="text-sidebar-foreground/50 shrink-0" />
                <span className="text-sidebar-foreground/50 text-xs">Type:</span>
                <span className="font-medium text-sidebar-foreground">
                  {notification.type === "student_corner" ? "Student Corner" : "Notification"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                <Tag size={13} className="text-sidebar-foreground/50 shrink-0" />
                <span className="text-sidebar-foreground/50 text-xs">Created By:</span>
                <span className="font-medium text-sidebar-foreground">
                  {notification.sender_name || "System"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                <Calendar size={13} className="text-sidebar-foreground/50 shrink-0" />
                <span className="text-sidebar-foreground/50 text-xs">{t("notification.view.created")}:</span>
                <span className="font-medium text-sidebar-foreground">
                  {moment(notification.createdAt).format("DD-MM-YYYY, HH:mm")}
                </span>
              </div>
              {notification.status === "sent" && notification.send_date && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                  <Calendar size={13} className="text-sidebar-foreground/50 shrink-0" />
                  <span className="text-sidebar-foreground/50 text-xs">{t("notification.view.sentAt")}:</span>
                  <span className="font-medium text-sidebar-foreground">
                    {moment(notification.send_date).format("DD-MM-YYYY, HH:mm")}
                  </span>
                </div>
              )}
              {notification.expiry_date && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                  <Calendar size={13} className="text-sidebar-foreground/50 shrink-0" />
                  <span className="text-sidebar-foreground/50 text-xs">Expires:</span>
                  <span className="font-medium text-sidebar-foreground">
                    {moment(notification.expiry_date).format("DD-MM-YYYY")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {notification.attachments && notification.attachments.length > 0 && (
            <div className="rounded-xl border border-sidebar-border bg-sidebar p-5 space-y-3">
              <h3 className="font-semibold text-sidebar-foreground flex items-center gap-2">
                <Paperclip size={16} />
                Attachments ({notification.attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {notification.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-sidebar-border rounded-lg bg-sidebar-accent/10 hover:bg-sidebar-accent/30 transition-colors group"
                  >
                    <div className="p-2 bg-sidebar-primary/10 rounded-md text-sidebar-primary shrink-0 group-hover:scale-105 transition-transform">
                      <File size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate text-sidebar-foreground" title={file.file_name}>
                        {file.file_name}
                      </p>
                      <p className="text-xs text-sidebar-foreground/50 mt-0.5">
                        {((file.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {notification.audit_trail && notification.audit_trail.length > 0 && (
            <div className="space-y-4 rounded-xl border border-sidebar-border bg-sidebar p-5">
              <h3 className="font-semibold text-sidebar-foreground">
                Audit Trail
              </h3>
              <div className="space-y-3">
                {notification.audit_trail.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm border-b border-sidebar-border/50 pb-2 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-sidebar-primary shrink-0"></div>
                    <div className="flex-1 text-sidebar-foreground/80">
                      <span className="capitalize font-medium text-sidebar-foreground">{entry.action}</span> by{" "}
                      <span className="font-semibold text-sidebar-foreground">
                        {entry.user ? `${entry.user.first_name || ""} ${entry.user.last_name || ""}`.trim() : "System"}
                      </span>
                    </div>
                    <div className="text-xs text-sidebar-foreground/50">
                      {moment(entry.timestamp).format("DD-MM-YYYY, HH:mm:ss")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipients table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-semibold text-sidebar-foreground">
                Recipients
                {totalRows > 0 && (
                  <span className="ml-2 text-xs font-normal text-sidebar-foreground/50">
                    ({totalRows})
                  </span>
                )}
              </h3>
              <Input
                placeholder="Search by name or email..."
                className="w-56"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Read Status</TableHead>
                  <TableHead className="text-center">Read At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
                {recipientsLoading ? (
                  <TableSkeleton rows={rowsPerPage} columns={5} />
                ) : recipientsError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-8">
                      <ErrorMessage
                        message={recipientsError?.message || "Failed to load recipients"}
                        onRetry={refetch}
                        variant="inline"
                      />
                    </TableCell>
                  </TableRow>
                ) : recipients.length > 0 ? (
                  recipients.map((r, i) => (
                    <TableRow key={r._id}>
                      <TableCell className="text-sidebar-foreground/50 text-xs">
                        {(page - 1) * rowsPerPage + i + 1}
                      </TableCell>
                      <TableCell className="font-medium">{r.user?.name || "—"}</TableCell>
                      <TableCell className="text-sidebar-foreground/70">{r.user?.email || "—"}</TableCell>
                      <TableCell className="text-center">
                        {r.read ? (
                          <div className="flex items-center justify-center gap-1.5 text-green-500 font-medium text-xs">
                             <Check size={14} />
                             <span>Read</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs">
                             <X size={14} />
                             <span>Unread</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sidebar-foreground/70 text-xs">
                        {r.read_at ? moment(r.read_at).format("DD-MM-YYYY, HH:mm") : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-sidebar-foreground/60">
                      No recipients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Pagination
              page={page}
              setPage={setPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              totalRows={totalRows}
            />
          </div>
        </div>
      ) : (
        <p className="text-sidebar-foreground/60">Notification not found.</p>
      )}
    </div>
  );
};

export default NotificationDetail;
