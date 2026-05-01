import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import StatusBadge from "@/components/StatusBadge";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useGetAdminNotifications,
  useDeleteAdminNotification,
  useSendAdminNotification,
} from "@/store/useNotificationStore";
import TeacherNotificationModal from "@/components/teacher/notification/TeacherNotificationModal";
import DeleteConfirm from "@/components/DeleteConfirm";
import SendConfirm from "@/components/SendConfirm";
import { Pencil, Trash2, Send, Eye } from "lucide-react";
import moment from "moment";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "@tanstack/react-router";

const getRecipientsLabel = (n) => {
  if (n.meta?.batch_id) return `Batch: ${n.meta.batch_name || n.meta.batch_id}`;
  return "Students (Filtered)";
};

const TeacherNotifications = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sendTarget, setSendTarget] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } =
    useGetAdminNotifications({
      page,
      limit: rowsPerPage,
      created_by: user?._id,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    });

  const deleteMutation = useDeleteAdminNotification();
  const sendMutation = useSendAdminNotification();

  const notifications = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleView = (n) => {
    navigate({ to: `/teacher/notifications/${n._id}` });
  };
  const handleEdit = (n) => { setSelected(n); setModalOpen(true); };
  const handleCreate = () => { setSelected(null); setModalOpen(true); };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
  };

  const handleSendConfirm = () => {
    sendMutation.mutate(sendTarget, { onSuccess: () => setSendTarget(null) });
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        My Sent Alerts
      </h2>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search my alerts..."
            className="w-56"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="drafted">Drafted</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>Send New Alert</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Target Batch</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Send Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
                <ErrorMessage message={error?.message || "Failed to load notifications"} onRetry={refetch} variant="inline" />
              </TableCell>
            </TableRow>
          ) : notifications.length > 0 ? (
            notifications.map((n) => (
              <TableRow key={n._id}>
                <TableCell className="font-medium">
                  {n.subject || <span className="text-sidebar-foreground/40 italic">No subject</span>}
                </TableCell>
                <TableCell>{getRecipientsLabel(n)}</TableCell>
                <TableCell><StatusBadge status={n.status} /></TableCell>
                <TableCell>
                  {n.status === "sent" && n.send_date
                    ? moment(n.send_date).format("DD-MM-YYYY")
                    : <span className="text-sidebar-foreground/40">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleView(n)}
                      className="cursor-pointer p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      title="View"
                    >
                      <Eye size={15} />
                    </button>
                    {n.status !== "sent" && (
                      <>
                        <button
                          onClick={() => handleEdit(n)}
                          className="cursor-pointer p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setSendTarget(n._id)}
                          disabled={sendMutation.isPending}
                          className="cursor-pointer p-1.5 rounded-md text-sidebar-foreground/60 hover:text-green-500 hover:bg-green-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Send"
                        >
                          <Send size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(n._id)}
                          disabled={deleteMutation.isPending}
                          className="cursor-pointer p-1.5 rounded-md text-sidebar-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-sidebar-foreground/60">
                No alerts found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalRows={totalRows} />

      <TeacherNotificationModal key={selected?._id || "new"} open={modalOpen} onClose={() => setModalOpen(false)} notification={selected} />

      <DeleteConfirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
        data="notification"
      />
      <SendConfirm
        open={!!sendTarget}
        onClose={() => setSendTarget(null)}
        onConfirm={handleSendConfirm}
        isLoading={sendMutation.isPending}
      />
    </div>
  );
};

export default TeacherNotifications;
