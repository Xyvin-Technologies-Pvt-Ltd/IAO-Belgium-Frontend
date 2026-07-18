import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import StatusBadge from "@/components/StatusBadge";
import { useGetKmoApplications, useUpdateKmoStatus } from "@/store/usePaymentStore";
import { useDebounce } from "@/hooks/useDebounce";
import { Edit2, Eye, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import moment from "moment";
import { toast } from "sonner";

const KmoManagement = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const debouncedSearch = useDebounce(search, 500);

  // Queries
  const { data, isLoading, error, refetch } = useGetKmoApplications({
    page,
    limit: rowsPerPage,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(debouncedSearch ? { student_id: debouncedSearch } : {}), // Search by student
  });

  const applications = data?.data?.rows || [];
  const totalRows = data?.data?.total || 0;

  // Mutation
  const updateStatusMutation = useUpdateKmoStatus();

  // Dialog State
  const [selectedApp, setSelectedApp] = useState(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Update Form State
  const [newStatus, setNewStatus] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleOpenUpdate = (app) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setProjectNumber(app.project_number || "");
    setRejectionReason(app.reason || "");
    setNotes(app.notes || "");
    setIsUpdateOpen(true);
  };

  const handleOpenDetails = (app) => {
    setSelectedApp(app);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;

    if (newStatus === "submitted" && !projectNumber.trim()) {
      toast.error("Project number is required for Submitted status");
      return;
    }

    if (newStatus === "rejected" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required when rejecting KMO application");
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedApp._id,
        data: {
          status: newStatus,
          project_number: projectNumber,
          reason: rejectionReason,
          notes: notes,
        },
      });
      setIsUpdateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const getDisplayStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "paid";
      case "rejected":
        return "failed";
      case "waiting":
        return "pending";
      case "submitted":
        return "ongoing";
      case "contribution_received":
      case "payment_released":
        return "available";
      default:
        return "pending";
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          KMO-Portefeuille Applications
        </h2>
      </div>

      {/* Filters Bar */}
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student ID..."
            className="max-w-xs h-10 rounded-[6px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-10 rounded-[6px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="waiting">Waiting for KMO</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="contribution_received">Contribution Received</SelectItem>
              <SelectItem value="payment_released">Payment Released</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      {error ? (
        <ErrorMessage message={error.message || "Failed to load KMO applications"} />
      ) : isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <div className="bg-sidebar rounded-xl border border-sidebar-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Learning Module</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No KMO applications found.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app._id}>
                    <TableCell>
                      <p className="font-semibold text-gray-900">
                        {app.student_id?.first_name} {app.student_id?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{app.student_id?.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-gray-900">{app.module_id?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.module_id?.currency || "EUR"} {app.module_id?.amount}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-gray-900">{app.company_id?.company_name}</p>
                      <p className="text-xs text-muted-foreground">VAT: {app.company_id?.vat_number}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getDisplayStatusColor(app.status)} label={app.status} />
                    </TableCell>
                    <TableCell>
                      {moment(app.createdAt).format("DD MMM YYYY HH:mm")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDetails(app)}
                        className="rounded-[6px]"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {app.status !== "paid" && app.status !== "rejected" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenUpdate(app)}
                          className="rounded-[6px]"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalRows > rowsPerPage && (
            <div className="p-4 border-t border-sidebar-border">
              <Pagination
                currentPage={page}
                totalCount={totalRows}
                pageSize={rowsPerPage}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Details Dialog */}
      {selectedApp && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle>KMO Application Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-2 border-b border-sidebar-border pb-3">
                <p className="font-bold text-gray-500">Student:</p>
                <p className="font-semibold text-gray-900">{selectedApp.student_id?.first_name} {selectedApp.student_id?.last_name}</p>
                
                <p className="font-bold text-gray-500">Module:</p>
                <p className="font-semibold text-gray-900">{selectedApp.module_id?.name}</p>

                <p className="font-bold text-gray-500">Amount:</p>
                <p className="font-semibold text-gray-900">{selectedApp.module_id?.currency || "EUR"} {selectedApp.module_id?.amount}</p>
              </div>

              <div className="space-y-2 border-b border-sidebar-border pb-3">
                <p className="font-bold text-gray-700 flex items-center gap-1">
                  <Building2 className="w-4 h-4" /> Company Details
                </p>
                <p><span className="font-semibold text-gray-500">Name:</span> {selectedApp.company_id?.company_name}</p>
                <p><span className="font-semibold text-gray-500">Registration #:</span> {selectedApp.company_id?.registration_number}</p>
                <p><span className="font-semibold text-gray-500">VAT #:</span> {selectedApp.company_id?.vat_number}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-sidebar-border pb-3">
                <p className="font-bold text-gray-500">Project Number:</p>
                <p className="font-semibold text-gray-900">{selectedApp.project_number || "N/A"}</p>

                <p className="font-bold text-gray-500">Current Status:</p>
                <p className="font-bold text-amber-600 capitalize">{selectedApp.status}</p>
              </div>

              {selectedApp.reason && (
                <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-200">
                  <p className="font-bold">Rejection Reason:</p>
                  <p>{selectedApp.reason}</p>
                </div>
              )}

              {selectedApp.notes && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-800">Admin Notes:</p>
                  <p className="text-xs text-gray-600 mt-1">{selectedApp.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsDetailsOpen(false)} className="rounded-[6px]">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Dialog */}
      {selectedApp && (
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle>Update KMO Application Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-[6px] h-10">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="contribution_received">Contribution Received</SelectItem>
                    <SelectItem value="payment_released">Payment Released</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === "submitted" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Project Number (Required)</label>
                  <Input
                    value={projectNumber}
                    onChange={(e) => setProjectNumber(e.target.value)}
                    placeholder="Enter KMO Project Number..."
                    className="rounded-[6px] h-10"
                  />
                </div>
              )}

              {newStatus === "rejected" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Rejection Reason (Required)</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason to send to student..."
                    className="rounded-[6px] min-h-[80px]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Internal Notes (Optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter internal details..."
                  className="rounded-[6px] min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsUpdateOpen(false)} className="rounded-[6px]">
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updateStatusMutation.isPending}
                className="rounded-[6px]"
              >
                {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default KmoManagement;
