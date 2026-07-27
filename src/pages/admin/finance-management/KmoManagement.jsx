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
import { useGetAllPrograms, useGetBatches } from "@/store/useDropdownStore";
import { useDebounce } from "@/hooks/useDebounce";
import { Edit2, Eye, Building2, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
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
import { useCanModify } from "@/hooks/useCanModify";

const KmoManagement = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("finance");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filters State with Session Persistence
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("kmo_management_filters");
    return saved ? JSON.parse(saved) : {
      search: "",
      status: "all",
      program: "all",
      batch: "all",
    };
  });

  // Save filters in session storage
  useEffect(() => {
    sessionStorage.setItem("kmo_management_filters", JSON.stringify(filters));
  }, [filters]);

  const debouncedSearch = useDebounce(filters.search, 500);

  // Fetch programs dropdown list
  const { data: programsData } = useGetAllPrograms({ limit: 1000 });
  const programsList = programsData?.data || [];

  // Fetch batches dropdown list
  const selectedProgramId = filters.program !== "all" ? filters.program : null;
  const { data: batchesData } = useGetBatches(
    selectedProgramId,
    { limit: 1000 },
    { enabled: !!selectedProgramId }
  );
  const batchesList = batchesData?.data || [];

  // Queries
  const { data, isLoading, error, refetch } = useGetKmoApplications({
    page,
    limit: rowsPerPage,
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(debouncedSearch ? { student_id: debouncedSearch } : {}), // Search by student (name/email/ID on backend)
    ...(filters.program !== "all" ? { program: filters.program } : {}),
    ...(filters.batch !== "all" ? { batch: filters.batch } : {}),
  });

  const applications = data?.data?.rows || [];
  const totalRows = data?.data?.total || 0;

  // Mutation
  const updateStatusMutation = useUpdateKmoStatus();

  // Dialog State
  const [selectedApp, setSelectedApp] = useState(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmationsOpen, setIsConfirmationsOpen] = useState(false);

  // Update Form State
  const [newStatus, setNewStatus] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");

  const STATUS_OPTIONS = [
    { value: "submitted", label: "Submitted" },
    { value: "contribution_received", label: "Contribution Received" },
    { value: "payment_released", label: "Payment Released" },
    { value: "paid", label: "Paid" },
    { value: "rejected", label: "Rejected" },
  ];

  // Submitted is only for waiting → submitted (project number step). Hide once already past waiting.
  const availableStatusOptions = STATUS_OPTIONS.filter((opt) => {
    if (opt.value === "submitted" && selectedApp?.status !== "waiting") {
      return false;
    }
    // Don't offer the current status again
    if (selectedApp?.status && opt.value === selectedApp.status) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.program, filters.batch]);

  const handleProgramChange = (val) => {
    setFilters(prev => ({
      ...prev,
      program: val,
      batch: "all"
    }));
  };

  const handleOpenUpdate = (app) => {
    setSelectedApp(app);
    setNewStatus("");
    setProjectNumber(app.project_number || "");
    setRejectionReason(app.reason || "");
    setNotes(app.notes || "");
    setIsUpdateOpen(true);
  };

  const handleOpenDetails = (app) => {
    setSelectedApp(app);
    setIsConfirmationsOpen(false);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async () => {
    const isSubmittedApp = selectedApp?.status === "submitted";
    // After student "I Have Applied", admin may only add project number (keep submitted)
    const statusToSend = newStatus || (isSubmittedApp ? "submitted" : "");
    if (!statusToSend) return;

    const needsProjectNumber =
      statusToSend === "submitted" ||
      (isSubmittedApp && statusToSend === "contribution_received");

    if (needsProjectNumber && !projectNumber.trim()) {
      toast.error("Project number is required");
      return;
    }

    if (statusToSend === "rejected" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required when rejecting KMO application");
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedApp._id,
        data: {
          status: statusToSend,
          project_number: projectNumber,
          reason: rejectionReason,
          notes: notes,
        },
      });
      setIsUpdateOpen(false);
      refetch();
    } catch (err) {
      // Error toast is already handled by useUpdateKmoStatus onError callback
      console.error("Failed to update status:", err);
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
        <div className="flex flex-wrap flex-1 items-center gap-3">
          <Input
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search by student..."
            className="max-w-xs h-10 rounded-[6px]"
          />
          
          <Select value={filters.status} onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}>
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

          <Select value={filters.program} onValueChange={handleProgramChange}>
            <SelectTrigger className="w-[220px] h-10 rounded-[6px]">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programsList.map((prog) => (
                <SelectItem key={prog._id} value={prog._id}>
                  {prog.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.batch} 
            onValueChange={(val) => setFilters(prev => ({ ...prev, batch: val }))}
            disabled={filters.program === "all"}
          >
            <SelectTrigger className="w-[200px] h-10 rounded-[6px]">
              <SelectValue placeholder={filters.program === "all" ? "Select Program First" : "All Batches"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batchesList.map((b) => (
                <SelectItem key={b._id} value={b._id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filters.search || filters.status !== "all" || filters.program !== "all" || filters.batch !== "all") && (
            <Button
              variant="outline"
              onClick={() => setFilters({
                search: "",
                status: "all",
                program: "all",
                batch: "all",
              })}
              className="h-10 rounded-[6px] border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {error ? (
        <ErrorMessage message={error.message || "Failed to load KMO applications"} />
      ) : isLoading ? (
        <TableSkeleton rows={5} columns={8} />
      ) : (
        <div className="bg-sidebar rounded-xl border border-sidebar-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Batch</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No KMO applications found.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app._id}>
                    <TableCell>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {app.student_id?.first_name} {app.student_id?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{app.student_id?.email}</p>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-gray-700 dark:text-gray-300">
                      {app.program?.name || "-"}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {app.batch?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-gray-900 dark:text-white">{app.module_id?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.module_id?.currency || "EUR"} {app.module_id?.amount}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-gray-900 dark:text-white">{app.company_id?.company_name}</p>
                      <p className="text-xs text-muted-foreground">VAT: {app.company_id?.vat_number}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getDisplayStatusColor(app.status)} label={app.status} />
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
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
                      {canModify && app.status !== "paid" && app.status !== "rejected" && (
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
          <DialogContent className="max-w-md rounded-xl bg-white dark:bg-sidebar border border-sidebar-border">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">KMO Application Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
              {/* Primary Details */}
              <div className="grid grid-cols-2 gap-2 border-b border-sidebar-border pb-3">
                <p className="font-bold text-gray-500 dark:text-gray-400">Project Number:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedApp.project_number || "N/A"}</p>

                <p className="font-bold text-gray-500 dark:text-gray-400">Current Status:</p>
                <p className="font-bold text-amber-600 dark:text-amber-400 capitalize">{selectedApp.status}</p>

                <p className="font-bold text-gray-500 dark:text-gray-400">Student:</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedApp.student_id?.first_name} {selectedApp.student_id?.last_name}
                  <span className="block text-xs font-normal text-muted-foreground">{selectedApp.student_id?.email}</span>
                </p>

                <p className="font-bold text-gray-500 dark:text-gray-400">Program:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedApp.program?.name || "-"}</p>

                <p className="font-bold text-gray-500 dark:text-gray-400">Batch:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedApp.batch?.name || "-"}</p>
                
                <p className="font-bold text-gray-500 dark:text-gray-400">Module:</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedApp.module_id?.name}
                  <span className="block text-xs font-normal text-muted-foreground">{selectedApp.module_id?.currency || "EUR"} {selectedApp.module_id?.amount}</span>
                </p>
              </div>

              {/* Company Details */}
              <div className="space-y-2 border-b border-sidebar-border pb-3">
                <p className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" /> Company Details
                </p>
                <p><span className="font-semibold text-gray-500 dark:text-gray-400">Name:</span> <span className="text-gray-900 dark:text-white font-medium">{selectedApp.company_id?.company_name}</span></p>
                <p><span className="font-semibold text-gray-500 dark:text-gray-400">Registration #:</span> <span className="text-gray-900 dark:text-white font-medium">{selectedApp.company_id?.registration_number}</span></p>
                <p><span className="font-semibold text-gray-500 dark:text-gray-400">VAT #:</span> <span className="text-gray-900 dark:text-white font-medium">{selectedApp.company_id?.vat_number}</span></p>
              </div>

              {selectedApp.reason && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                  <p className="font-bold">Rejection Reason:</p>
                  <p>{selectedApp.reason}</p>
                </div>
              )}

              {selectedApp.notes && (
                <div className="bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">Admin Notes:</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{selectedApp.notes}</p>
                </div>
              )}

              {/* Collapsible Student Confirmations (Accordion) */}
              <div className="border border-sidebar-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsConfirmationsOpen(!isConfirmationsOpen)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Student Confirmations
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedApp.confirmations?.confirmed_at && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {moment(selectedApp.confirmations.confirmed_at).format("DD MMM HH:mm")}
                      </span>
                    )}
                    {isConfirmationsOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </button>

                {isConfirmationsOpen && (
                  <div className="p-3 bg-white dark:bg-sidebar space-y-2 border-t border-sidebar-border pt-3 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Submitted KMO Application</span>
                      {selectedApp.confirmations?.submitted_kmo_app ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Deposited Contribution</span>
                      {selectedApp.confirmations?.deposited_contribution ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Granted Transfer Permission</span>
                      {selectedApp.confirmations?.granted_permission ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
          <DialogContent className="max-w-md rounded-xl bg-white dark:bg-sidebar border border-sidebar-border">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Update KMO Application Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-[6px] h-10">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(newStatus === "submitted" || selectedApp.status === "submitted") && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    Project Number (Required)
                  </label>
                  <Input
                    value={projectNumber}
                    onChange={(e) => setProjectNumber(e.target.value)}
                    placeholder="Enter KMO Project Number..."
                    className="rounded-[6px] h-10"
                  />
                  {selectedApp.status === "submitted" && !newStatus && (
                    <p className="text-xs text-muted-foreground">
                      Student already confirmed. Save the project number here, or pick the next status below.
                    </p>
                  )}
                </div>
              )}

              {newStatus === "rejected" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Rejection Reason (Required)</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason to send to student..."
                    className="rounded-[6px] min-h-[80px]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Internal Notes (Optional)</label>
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
                disabled={
                  updateStatusMutation.isPending ||
                  (!newStatus && selectedApp.status !== "submitted")
                }
                className="rounded-[6px]"
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : selectedApp.status === "submitted" && !newStatus
                    ? "Save Project Number"
                    : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default KmoManagement;
