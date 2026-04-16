import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, Calendar, Tag, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/table/Pagination";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
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
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data: notifData, isLoading: notifLoading } = useGetNotificationById(id);
  const notification = notifData?.data;

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

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/admin/notification-management" })}
          className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          Notification Detail
        </h2>
      </div>

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
              <p className="text-sm text-sidebar-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: notification.message }}
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
                <Calendar size={13} className="text-sidebar-foreground/50 shrink-0" />
                <span className="text-sidebar-foreground/50 text-xs">{t("notification.view.created")}:</span>
                <span className="font-medium text-sidebar-foreground">
                  {moment(notification.createdAt).format("MMM DD, YYYY · HH:mm")}
                </span>
              </div>
              {notification.status === "sent" && notification.send_date && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                  <Calendar size={13} className="text-sidebar-foreground/50 shrink-0" />
                  <span className="text-sidebar-foreground/50 text-xs">{t("notification.view.sentAt")}:</span>
                  <span className="font-medium text-sidebar-foreground">
                    {moment(notification.send_date).format("MMM DD, YYYY · HH:mm")}
                  </span>
                </div>
              )}
              {notification.expiry_date && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                  <Calendar size={13} className="text-sidebar-foreground/50 shrink-0" />
                  <span className="text-sidebar-foreground/50 text-xs">Expires:</span>
                  <span className="font-medium text-sidebar-foreground">
                    {moment(notification.expiry_date).format("MMM DD, YYYY")}
                  </span>
                </div>
              )}
            </div>
          </div>

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
                  <TableHead className="text-center">Read</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
                {recipientsLoading ? (
                  <TableSkeleton rows={rowsPerPage} columns={4} />
                ) : recipientsError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center p-8">
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
                          <Check size={16} className="text-green-500 mx-auto" />
                        ) : (
                          <X size={16} className="text-gray-400 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-sidebar-foreground/60">
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
