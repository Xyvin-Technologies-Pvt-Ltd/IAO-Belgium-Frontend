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
import { useGetThirdPartyApplications, useAdminCancelThirdParty } from "@/store/usePaymentStore";
import { useDebounce } from "@/hooks/useDebounce";
import { Ban, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCanModify } from "@/hooks/useCanModify";

const ThirdPartyPaymentManagement = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("finance");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [purposeFilter, setPurposeFilter] = useState("all");

  const debouncedSearch = useDebounce(search, 500);

  // Queries
  const { data, isLoading, error, refetch, isFetching } = useGetThirdPartyApplications({
    page,
    limit: rowsPerPage,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(purposeFilter !== "all" ? { purpose: purposeFilter } : {}),
    ...(debouncedSearch ? { student_id: debouncedSearch } : {}),
  });

  const applications = data?.data?.applications || [];
  const pagination = data?.data?.pagination || {};
  const totalRows = pagination.total || 0;

  // Mutation
  const cancelMutation = useAdminCancelThirdParty();

  // Dialog State
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [appToCancel, setAppToCancel] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, purposeFilter]);

  const formatPurpose = (purpose) => {
    switch (purpose) {
      case "admission-fee":
        return t("Admission Fee");
      case "location-switch":
        return t("Location Switch");
      case "module-purchase":
        return t("Module Purchase");
      default:
        return purpose || t("Module Purchase");
    }
  };

  const getSubjectLabel = (app) => {
    if (app.purpose === "admission-fee") {
      return {
        title: app.program_name || t("Admission Fee"),
        subtitle: app.application_id?.uid
          ? `App ${app.application_id.uid}`
          : t("Enrollment"),
      };
    }
    if (app.purpose === "location-switch") {
      return {
        title: app.module_id?.name || t("Location Switch"),
        subtitle: app.module_id?.code || t("Location switch"),
      };
    }
    return {
      title: app.module_id?.name || "-",
      subtitle: app.module_id?.code || "-",
    };
  };

  const handleOpenDetails = (app) => {
    setSelectedApp(app);
    setIsDetailsOpen(true);
  };

  const handleCancelClick = (app) => {
    setAppToCancel(app);
    setIsCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!appToCancel) return;

    try {
      await cancelMutation.mutateAsync(appToCancel._id);
      setIsCancelConfirmOpen(false);
      setAppToCancel(null);
      refetch();
    } catch (err) {
      // Error toast is already handled by useAdminCancelThirdParty onError callback
    }
  };

  return (
    <div className="space-y-6 mt-4 text-dashboard-text dark:text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("Third-Party Payments")}
        </h2>
      </div>

      {/* Filters bar */}
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Input
            placeholder={t("Search by student ID...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs h-10 rounded-[6px]"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-10 rounded-[6px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="invoice_issued">Awaiting Payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="conflicts">Conflicts</SelectItem>
            </SelectContent>
          </Select>

          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger className="w-[200px] h-10 rounded-[6px]">
              <SelectValue placeholder="All Purposes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              <SelectItem value="admission-fee">Admission Fee</SelectItem>
              <SelectItem value="module-purchase">Module Purchase</SelectItem>
              <SelectItem value="location-switch">Location Switch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conflicts Alert Banner */}
      {statusFilter === "conflicts" && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-300 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">{t("Finance Reconciliation Required")}</h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {t("These applications received a webhook paid confirmation from Mollie AFTER the arrangement was cancelled or expired. Finance admin must manually verify that credit notes match bank statements in Exact Online.")}
            </p>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Student")}</TableHead>
            <TableHead>{t("Purpose")}</TableHead>
            <TableHead>{t("Subject")}</TableHead>
            <TableHead>{t("Invoice")}</TableHead>
            <TableHead>{t("Amount")}</TableHead>
            <TableHead>{t("Status")}</TableHead>
            <TableHead>{t("Created")}</TableHead>
            <TableHead className="text-right">{t("Actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={8} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("Failed to load applications")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : applications.length > 0 ? (
            applications.map((app) => {
              const subject = getSubjectLabel(app);
              return (
              <TableRow
                key={app._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleOpenDetails(app)}
              >
                <TableCell>
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    {app.student_id?.first_name} {app.student_id?.last_name}
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block mt-0.5">{app.student_id?.email}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {formatPurpose(app.purpose)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{subject.title}</div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block mt-0.5">{subject.subtitle}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                    {app.invoice_id?.uid || t("Draft")}
                  </span>
                </TableCell>
                <TableCell className="font-bold text-gray-900 dark:text-gray-100">
                  &euro; {Number(app.invoice_id?.total_amount || 0).toFixed(2)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-1 items-start">
                    <StatusBadge status={app.status} />
                    {app.conflict_flags?.includes("PAYMENT_RECEIVED_AFTER_CANCELLATION") && (
                      <span className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/50 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {t("Late Paid Conflict")}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                  {moment(app.createdAt).format("DD/MM/YYYY HH:mm")}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      onClick={() => handleOpenDetails(app)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canModify && app.status === "invoice_issued" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => handleCancelClick(app)}
                        disabled={cancelMutation.isPending}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium">
                {t("No applications found.")}
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

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-sidebar border border-sidebar-border text-dashboard-text dark:text-white rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">{t("Arrangement Details")}</DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 mt-4 text-sm text-gray-900 dark:text-white">
              <div className="bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{t("Student")}</span>
                  <span className="font-bold">
                    {selectedApp.student_id?.first_name} {selectedApp.student_id?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{t("Purpose")}</span>
                  <span className="font-bold">{formatPurpose(selectedApp.purpose)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {selectedApp.purpose === "admission-fee" ? t("Enrollment") : t("Module")}
                  </span>
                  <span className="font-bold text-right">
                    {selectedApp.purpose === "admission-fee"
                      ? selectedApp.application_id?.uid || "-"
                      : selectedApp.module_id?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{t("Status")}</span>
                  <span className="font-bold uppercase">{selectedApp.status.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{t("Invoice Reference")}</span>
                  <span className="font-mono font-bold">{selectedApp.invoice_id?.uid || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{t("Exact Sales Entry")}</span>
                  <span className="font-mono text-xs">
                    {selectedApp.invoice_id?.meta?.exact?.entry_id ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t("Pushed")}</span>
                    ) : (
                      <span className="text-gray-400">{t("Pending")}</span>
                    )}
                  </span>
                </div>
              </div>

              {selectedApp.mollie_payment_link_url && (
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">{t("Mollie Checkout URL")}</span>
                  <a 
                    href={selectedApp.mollie_payment_link_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline break-all block"
                  >
                    {selectedApp.mollie_payment_link_url}
                  </a>
                </div>
              )}

              {selectedApp.conflict_flags?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{t("Unresolved Conflicts")}</span>
                  </div>
                  <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-1 pl-1">
                    {selectedApp.conflict_flags.map((flag) => (
                      <li key={flag}>{flag.replace("_", " ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)} className="rounded-[6px]">
              {t("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-sidebar border border-sidebar-border text-dashboard-text dark:text-white rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">{t("Cancel Arrangement")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              {t("Are you sure you want to cancel this third-party payment arrangement? A credit note will be issued in Exact Online and regular student checkout options will be restored.")}
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsCancelConfirmOpen(false)} 
              disabled={cancelMutation.isPending} 
              className="rounded-[6px]"
            >
              {t("No, Keep it")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmCancel} 
              disabled={cancelMutation.isPending} 
              className="rounded-[6px]"
            >
              {cancelMutation.isPending ? t("Cancelling...") : t("Yes, Cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThirdPartyPaymentManagement;
