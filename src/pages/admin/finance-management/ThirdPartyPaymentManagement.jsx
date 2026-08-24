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
import { useGetThirdPartyApplications, useAdminCancelThirdParty, useAdminReconcileThirdParty } from "@/store/usePaymentStore";
import { useGetAllPrograms, useGetBatches } from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useDebounce } from "@/hooks/useDebounce";
import { Ban, Eye, AlertTriangle, RefreshCw } from "lucide-react";
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
  const [programFilter, setProgramFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");

  const debouncedSearch = useDebounce(search, 500);
  const selectedProgramId = programFilter !== "all" ? programFilter : null;

  const hasActiveFilters =
    !!debouncedSearch ||
    statusFilter !== "all" ||
    purposeFilter !== "all" ||
    programFilter !== "all" ||
    batchFilter !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPurposeFilter("all");
    setProgramFilter("all");
    setBatchFilter("all");
    setProgramSearchTerm("");
    setBatchSearchTerm("");
    setPage(1);
  };

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms({
    ...(programSearchTerm && { search: programSearchTerm }),
  });

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgramId,
    {
      include_closed: true,
      ...(batchSearchTerm && { search: batchSearchTerm }),
    },
    { enabled: !!selectedProgramId }
  );

  const programItems = [
    { _id: "all", name: t("All Programs") },
    ...(programsData?.data?.map((p) => ({
      ...p,
      name: `${p.name} - ${p.language?.name || ""} - ${p.city?.name || ""}`,
    })) || []),
  ];

  const batchItems = [
    { _id: "all", name: t("All Batches") },
    ...(batchesData?.data || []),
  ];

  // Queries
  const { data, isLoading, error, refetch, isFetching } = useGetThirdPartyApplications({
    page,
    limit: rowsPerPage,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(purposeFilter !== "all" ? { purpose: purposeFilter } : {}),
    ...(programFilter !== "all" ? { program: programFilter } : {}),
    ...(batchFilter !== "all" ? { batch: batchFilter } : {}),
    ...(debouncedSearch ? { student_id: debouncedSearch } : {}),
  });

  const applications = data?.data?.applications || [];
  const pagination = data?.data?.pagination || {};
  const totalRows = pagination.total || 0;

  // Mutation
  const cancelMutation = useAdminCancelThirdParty();
  const reconcileMutation = useAdminReconcileThirdParty();

  // Dialog State
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [appToCancel, setAppToCancel] = useState(null);
  const [reconcilingId, setReconcilingId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, purposeFilter, programFilter, batchFilter]);

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

  const handleSyncFromMollie = async (app, { closeDetails = false } = {}) => {
    if (!app?._id) return;
    setReconcilingId(app._id);
    try {
      await reconcileMutation.mutateAsync(app._id);
      if (closeDetails) setIsDetailsOpen(false);
      refetch();
    } catch (err) {
      // Error toast is already handled by useAdminReconcileThirdParty onError callback
    } finally {
      setReconcilingId(null);
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
        <div className="flex flex-1 flex-wrap items-center gap-3">
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

          <div className="w-[260px]">
            <SearchableSelect
              placeholder={t("All Programs")}
              searchPlaceholder={t("Search programs...")}
              items={programItems}
              value={programFilter === "all" ? "all" : programFilter}
              onChange={(val) => {
                setProgramFilter(val || "all");
                setBatchFilter("all");
              }}
              onSearch={setProgramSearchTerm}
              isLoading={programsLoading}
            />
          </div>

          <div className="w-[220px]">
            <SearchableSelect
              placeholder={
                selectedProgramId
                  ? t("All Batches")
                  : t("Select a Program First")
              }
              searchPlaceholder={t("Search batches...")}
              items={batchItems}
              value={batchFilter === "all" ? "all" : batchFilter}
              onChange={(val) => setBatchFilter(val || "all")}
              onSearch={setBatchSearchTerm}
              isLoading={batchesLoading}
              disabled={!selectedProgramId}
            />
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-[6px] shrink-0"
              onClick={handleClearFilters}
            >
              {t("Clear Filters")}
            </Button>
          )}
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
            <TableHead>{t("Program")}</TableHead>
            <TableHead>{t("Batch")}</TableHead>
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
            <TableSkeleton rows={rowsPerPage} columns={10} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center p-8">
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
                    {app.program_name || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className="text-xs text-gray-700 dark:text-gray-300 block max-w-[160px] truncate"
                    title={app.batch_name || ""}
                  >
                    {app.batch_name || "-"}
                  </span>
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
                      title={t("View details")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canModify && ["invoice_issued", "cancelling"].includes(app.status) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
                        onClick={() => handleSyncFromMollie(app)}
                        disabled={reconcileMutation.isPending && reconcilingId === app._id}
                        title={t("Sync from Mollie")}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            reconcileMutation.isPending && reconcilingId === app._id
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                      </Button>
                    )}
                    {canModify && app.status === "invoice_issued" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => handleCancelClick(app)}
                        disabled={cancelMutation.isPending}
                        title={t("Cancel")}
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
              <TableCell colSpan={10} className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium">
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
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("Student")}</span>
                  <span className="font-bold text-right">
                    {selectedApp.student_id?.first_name} {selectedApp.student_id?.last_name}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("Purpose")}</span>
                  <span className="font-bold text-right">{formatPurpose(selectedApp.purpose)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("Program")}</span>
                  <span className="font-bold text-right">
                    {selectedApp.program_name || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("Batch")}</span>
                  <span className="font-bold text-right break-words max-w-[60%]">
                    {selectedApp.batch_name || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">
                    {selectedApp.purpose === "admission-fee" ? t("Enrollment") : t("Module")}
                  </span>
                  <span className="font-bold text-right">
                    {selectedApp.purpose === "admission-fee"
                      ? selectedApp.application_id?.uid || "-"
                      : selectedApp.module_id?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("Status")}</span>
                  <span className="font-bold uppercase text-right">{selectedApp.status.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("Invoice Reference")}</span>
                  <span className="font-mono font-bold text-right">{selectedApp.invoice_id?.uid || "-"}</span>
                </div>
              </div>

              {(selectedApp.payment_id?.company?.company_name ||
                selectedApp.payment_id?.company?.address_line_1) && (
                <div className="bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-3">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                    {t("Bill to (third party)", "Bill to (third party)")}
                  </span>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("Name", "Name")}</span>
                    <span className="font-bold text-right">
                      {selectedApp.payment_id?.company?.company_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("Address", "Address")}</span>
                    <span className="font-bold text-right break-words max-w-[60%]">
                      {selectedApp.payment_id?.company?.address_line_1 || "-"}
                    </span>
                  </div>
                  {selectedApp.payment_id?.company?.vat_number && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("VAT number", "VAT number")}</span>
                      <span className="font-bold text-right">
                        {selectedApp.payment_id.company.vat_number}
                      </span>
                    </div>
                  )}
                  {selectedApp.payment_id?.company?.contact_person && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t("Contact person", "Contact person")}</span>
                      <span className="font-bold text-right">
                        {selectedApp.payment_id.company.contact_person}
                      </span>
                    </div>
                  )}
                </div>
              )}

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
          <DialogFooter className="flex justify-end gap-2">
            {canModify &&
              selectedApp &&
              ["invoice_issued", "cancelling"].includes(selectedApp.status) && (
                <Button
                  variant="outline"
                  className="rounded-[6px]"
                  onClick={() =>
                    handleSyncFromMollie(selectedApp, { closeDetails: true })
                  }
                  disabled={
                    reconcileMutation.isPending &&
                    reconcilingId === selectedApp._id
                  }
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      reconcileMutation.isPending &&
                      reconcilingId === selectedApp._id
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  {t("Sync from Mollie")}
                </Button>
              )}
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
