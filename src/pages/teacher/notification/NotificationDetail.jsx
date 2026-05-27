import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { Bell, Calendar, Tag, Check, X } from "lucide-react";
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

const TeacherNotificationDetail = () => {
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
          label: "My Sent Alerts",
          path: "/teacher/notifications",
          navigable: true,
        },
        {
          label: notification.subject || "Alert Detail",
          path: `/teacher/notification/${id}`,
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

  const getRecipientsLabel = () => {
    if (notification?.meta?.batch_id) {
      return `Batch: ${notification.meta.batch_name || notification.meta.batch_id}`;
    }
    return "Students (Filtered)";
  };

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
                  {notification.subject || "Alert Detail"}
                </p>
                <div className="mt-1">
                  <StatusBadge status={notification.status} />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="rounded-xl bg-sidebar-accent/30 border border-sidebar-border p-4">
              <p className="text-xs text-sidebar-foreground/50 mb-2 font-medium uppercase tracking-wide">
                Message
              </p>
              <div className="text-sm text-sidebar-foreground leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_img]:max-w-[300px] [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2"
                dangerouslySetInnerHTML={{ __html: notification.message }}
              />
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                <Tag size={13} className="text-sidebar-foreground/50 shrink-0" />
                <span className="text-sidebar-foreground/50 text-xs">Target:</span>
                <span className="font-medium text-sidebar-foreground">
                  {getRecipientsLabel()}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                <Calendar size={13} className="text-sidebar-foreground/50 shrink-0" />
                <span className="text-sidebar-foreground/50 text-xs">Created:</span>
                <span className="font-medium text-sidebar-foreground">
                  {moment(notification.createdAt).format("DD-MM-YYYY, HH:mm")}
                </span>
              </div>
              {notification.status === "sent" && notification.send_date && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20 text-sm">
                  <Calendar size={13} className="text-sidebar-foreground/50 shrink-0" />
                  <span className="text-sidebar-foreground/50 text-xs">Sent:</span>
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
                    {moment(notification.expiry_date).format("DD-MM-YYYY, HH:mm")}
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
        <p className="text-sidebar-foreground/60">Alert not found.</p>
      )}
    </div>
  );
};

export default TeacherNotificationDetail;