import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetFinanceQueue,
  useGetProformaErrors,
  useRetryPlanningProforma,
  useUpdateProformaStatus,
  useSendProformaFinanceEmail,
} from "@/store/useProformaStore";
import {
  financeEmailBadge,
  financeEmailStatus,
  isFinanceEmailSending,
  canRetryFinanceEmail,
  canSendFinanceEmail,
} from "@/utils/proformaFinanceEmail";
import { getProformaById } from "@/api/proformaApi";
import { uploadFile } from "@/api/uploadApi";
import { toast } from "sonner";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableSort } from "@/hooks/useTableSort";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import {
  ProformaInvoiceDocument,
  buildProformaInvoicePdfFile,
  openProformaInvoiceTab,
} from "./ProformaInvoiceDocument";
import ProformaInvoicesFilterDrawer, {
  EMPTY_PROFORMA_FILTERS,
} from "./ProformaInvoicesFilterDrawer";
import { MarkProformaPaidDialog, ProformaPaidBadge } from "./ProformaPaidActions";
import { ProformaFinanceEmailBadge } from "./ProformaFinanceEmailStatus";
import { coursePlanningLabel, proformaTeacherName, proformaTeacherRole } from "@/utils/proformaCourseLabel";
import { Eye, FileText, Mail, RotateCcw, Send } from "lucide-react";
import SortableTableHead from "@/components/ui/table/SortableTableHead";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";

export default function ProformaAdminManagement({ onViewInvoice }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const retryMutation = useRetryPlanningProforma();
  const updateStatusMutation = useUpdateProformaStatus();
  const sendFinanceEmailMutation = useSendProformaFinanceEmail();
  //* Expense note rendered off-screen to build its PDF when none was uploaded yet
  const [pdfNote, setPdfNote] = useState(null);
  const [preparingPdfId, setPreparingPdfId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [draftFilters, setDraftFilters] = useState({ ...EMPTY_PROFORMA_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_PROFORMA_FILTERS });
  const [payTarget, setPayTarget] = useState(null);
  const { sortBy, sortOrder, handleSort } = useTableSort("moved_to_finance_at", "desc", { setPage });

  const formatDateOnly = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const debouncedSearch = useDebounce(search, 500);
  const isFinanceTab = statusFilter === "MOVED_TO_FINANCE";

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, appliedFilters]);

  const queueFilter = useMemo(() => {
    let status = statusFilter;
    if (isFinanceTab) {
      const payment = appliedFilters.payment_status || "all";
      if (payment === "paid") status = "PAID";
      else if (payment === "unpaid") status = "MOVED_TO_FINANCE";
      else status = "MOVED_TO_FINANCE,PAID";
    }
    const f = {
      page,
      limit: rowsPerPage,
      status,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    };
    if (isFinanceTab) {
      f.sort_by = sortBy;
      f.sort_order = sortOrder;
    }
    ["program_type", "program_id", "component_id", "role", "location", "region", "start_date", "end_date"].forEach((key) => {
      if (appliedFilters[key] && appliedFilters[key] !== "all") {
        f[key] = appliedFilters[key];
      }
    });
    return f;
  }, [page, rowsPerPage, statusFilter, isFinanceTab, debouncedSearch, appliedFilters, sortBy, sortOrder]);

  const { data: queueData, isLoading: loadingQueue, isFetching: fetchingQueue, refetch: refetchQueue } = useGetFinanceQueue(
    queueFilter,
    {
      enabled: statusFilter !== "ERRORS",
      //* Poll while any email to Exact is in flight so badges settle on Sent / Email failed.
      refetchInterval: (query) =>
        (query.state.data?.data || []).some((inv) => isFinanceEmailSending(inv))
          ? 5000
          : false,
    }
  );

  const { data: errorsData, isLoading: loadingErrors, isFetching: fetchingErrors, refetch: refetchErrors } = useGetProformaErrors({
    page,
    limit: rowsPerPage,
  }, { enabled: statusFilter === "ERRORS" });

  const isErrorsTab = statusFilter === "ERRORS";
  const isLoading = isErrorsTab ? loadingErrors : loadingQueue;
  const isFetching = isErrorsTab ? fetchingErrors : fetchingQueue;

  const invoices = queueData?.data || [];
  const errorsList = errorsData?.data || [];
  const totalRows = isErrorsTab ? (errorsData?.total_count || 0) : (queueData?.total_count || 0);
  //* IPB-141: manual send is the only action once "Sent to Exact via Email" is latest,
  //* and is not offered again while "Sent to Exact Manually" is already the latest.
  const canSendManually = (inv) =>
    inv.status === "MOVED_TO_FINANCE" || Boolean(financeEmailStatus(inv));

  //* "Send to Exact via Email" / "Retry": reuse the PDF uploaded on "Send to finance";
  //* notes moved before IPB-139 have none, so build it here like the detail page does.
  const sendViaEmail = async (inv) => {
    if (inv.finance_email?.pdf_key) {
      sendFinanceEmailMutation.mutate({ id: inv._id });
      return;
    }
    let pdfKey;
    try {
      setPreparingPdfId(inv._id);
      const res = await getProformaById(inv._id);
      const full = res?.data || res;
      setPdfNote(full);
      const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
      await nextFrame();
      await nextFrame();
      const file = await buildProformaInvoicePdfFile(full);
      if (!file) throw new Error("Could not prepare the expense note PDF");
      const uploaded = await uploadFile(file);
      pdfKey = uploaded?.data?.key;
      if (!pdfKey) throw new Error("Could not upload the expense note PDF");
    } catch (err) {
      toast.error(err?.message || "Could not prepare the expense note PDF");
      return;
    } finally {
      setPdfNote(null);
      setPreparingPdfId(null);
    }
    sendFinanceEmailMutation.mutate({ id: inv._id, pdf_key: pdfKey });
  };

  const confirmMarkPaid = () => {
    if (!payTarget?._id) return;
    updateStatusMutation.mutate(
      {
        id: payTarget._id,
        data: { status: "PAID", notes: "Sent to Exact manually" },
      },
      { onSuccess: () => setPayTarget(null) }
    );
  };

  const statusBadges = {
    SENT_TO_TEACHER: {
      label: "Awaiting teacher",
      bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
    },
    CHANGE_REQUESTED: {
      label: "Change in progress",
      bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
    },
    TEACHER_SIGNED_APPROVED: {
      label: "Signed — ready for finance",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    MOVED_TO_FINANCE: {
      label: "In finance",
      bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400",
    },
    PAID: {
      label: "Sent to Exact Manually",
      bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400",
    },
  };

  const getStatusBadge = (inv) => {
    if (inv.status === "CHANGE_REQUESTED") {
      const awaitingAdmin = inv.workflow_next_actor === "ADMIN";
      return {
        label: awaitingAdmin ? "Awaiting admin" : "Awaiting teacher",
        bg: statusBadges.CHANGE_REQUESTED.bg,
      };
    }
    return (
      financeEmailBadge(inv) ||
      statusBadges[inv.status] || { label: inv.status, bg: "bg-muted text-muted-foreground" }
    );
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-dashboard-text dark:text-white">
            {t("proforma.teacherInvoices")}
          </h1>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <ProformaInvoicesFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
            showPaymentFilter={isFinanceTab}
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("proforma.list.search")}
            className="w-72"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap border-b border-border gap-4 text-sm font-medium">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`pb-3 border-b-2 transition ${
            statusFilter === "ALL"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("proforma.list.all")}
        </button>

        <button
          onClick={() => setStatusFilter("SENT_TO_TEACHER")}
          className={`pb-3 border-b-2 transition ${
            statusFilter === "SENT_TO_TEACHER"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Awaiting Teacher
        </button>

        <button
          onClick={() => setStatusFilter("CHANGE_REQUESTED")}
          className={`pb-3 border-b-2 transition ${
            statusFilter === "CHANGE_REQUESTED"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Needs Update
        </button>

        <button
          onClick={() => setStatusFilter("TEACHER_SIGNED_APPROVED")}
          className={`pb-3 border-b-2 transition ${
            statusFilter === "TEACHER_SIGNED_APPROVED"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Teacher Signed & Approved
        </button>

        <button
          onClick={() => setStatusFilter("MOVED_TO_FINANCE")}
          className={`pb-3 border-b-2 transition ${
            statusFilter === "MOVED_TO_FINANCE"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Moved to Finance
        </button>

        <button
          onClick={() => setStatusFilter("ERRORS")}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            statusFilter === "ERRORS"
              ? "border-red-600 text-red-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Unprocessed / Configuration Errors
          {errorsData?.total_count > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded-full font-bold">
              {errorsData.total_count}
            </span>
          )}
        </button>
      </div>

      {/* Table Container */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {isErrorsTab ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[200px]">Course / Planning Title</TableHead>
                <TableHead className="min-w-[120px]">City</TableHead>
                <TableHead className="min-w-[180px]">Assigned Teacher</TableHead>
                <TableHead className="min-w-[320px]">Generation Error Reason</TableHead>
                <TableHead className="text-center min-w-[160px]">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
              {isLoading ? (
                <TableSkeleton rows={rowsPerPage} columns={5} />
              ) : errorsList.length > 0 ? (
                errorsList.map((err) => (
                  <TableRow key={err._id} className="hover:bg-muted/40 transition">
                    <TableCell className="font-semibold text-foreground">
                      {err.planning_id?.description || err.planning_id?.venue || err.planning_title || "Course Planning"}
                      <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                        Venue: {err.planning_id?.venue_address || err.planning_id?.venue || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {err.city || err.planning_id?.city || "Unassigned City"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {proformaTeacherName(err.teacher_id)}
                      <span className="block text-xs text-muted-foreground font-normal mt-0.5">{err.teacher_id?.email}</span>
                    </TableCell>
                    <TableCell className="whitespace-normal break-words text-red-600 dark:text-red-400 font-mono text-xs leading-relaxed max-w-md">
                      {err.error_message}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                          disabled={retryMutation.isPending}
                          onClick={() => {
                            const pId = err.planning_id?._id || err.planning_id;
                            if (pId) {
                              retryMutation.mutate(pId);
                            }
                          }}
                        >
                          {retryMutation.isPending
                            ? t("common.retrying", { defaultValue: "Retrying..." })
                            : t("proforma.list.retry")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-600 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          onClick={() => { window.location.href = "/admin/proforma-settings"; }}
                        >
                          Configure Region
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                    No expense note generation errors found. All plannings were processed cleanly.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {isFinanceTab ? (
                  <SortableTableHead
                    sortKey="proforma_number"
                    activeKey={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    defaultOrder="asc"
                  >
                    {t("proforma.list.number")}
                  </SortableTableHead>
                ) : (
                  <TableHead>{t("proforma.list.number")}</TableHead>
                )}
                <TableHead>Teacher Name & Email</TableHead>
                {/* IPB-141: Role, Location, Region hidden in the finance tab (still filterable) */}
                {!isFinanceTab && <TableHead>Role</TableHead>}
                <TableHead>Course Planning</TableHead>
                {!isFinanceTab && <TableHead>Location</TableHead>}
                {!isFinanceTab && <TableHead>Region</TableHead>}
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                {isFinanceTab ? (
                  <SortableTableHead
                    sortKey="createdAt"
                    activeKey={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    defaultOrder="desc"
                  >
                    Date Generated
                  </SortableTableHead>
                ) : (
                  <TableHead className="text-center">Date Generated</TableHead>
                )}
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
              {isLoading ? (
                <TableSkeleton rows={rowsPerPage} columns={isFinanceTab ? 7 : 10} />
              ) : invoices.length > 0 ? (
                invoices.map((inv) => {
                  const badge = getStatusBadge(inv);
                  const { title, subtitle, locationLines } = coursePlanningLabel(inv);
                  const role = proformaTeacherRole(inv);

                  return (
                    <TableRow
                      key={inv._id}
                      className={`hover:bg-muted/40 transition ${
                        canRetryFinanceEmail(inv) ? "bg-red-50/60 dark:bg-red-950/20" : ""
                      }`}
                    >
                      <TableCell className="font-semibold text-foreground">{inv.proforma_number}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {proformaTeacherName(inv.teacher_id)}
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">{inv.teacher_id?.email}</span>
                      </TableCell>
                      {!isFinanceTab && (
                        <TableCell className="text-sm text-foreground whitespace-nowrap">
                          {role || "—"}
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-foreground">
                        {title}
                        {subtitle && (
                          <span className="block text-xs text-muted-foreground font-normal mt-0.5">{subtitle}</span>
                        )}
                      </TableCell>
                      {!isFinanceTab && (
                        <TableCell className="text-sm text-foreground max-w-[220px]">
                          {locationLines.length > 0 ? (
                            <>
                              <span className="font-medium">{locationLines[0]}</span>
                              {locationLines.slice(1).map((line) => (
                                <span
                                  key={line}
                                  className="block text-xs text-muted-foreground font-normal mt-0.5"
                                >
                                  {line}
                                </span>
                              ))}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {!isFinanceTab && (
                        <TableCell className="text-muted-foreground font-medium text-xs">
                          {inv.region_snapshot_name || "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        €{inv.grand_total?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center align-middle whitespace-nowrap">
                        {/* Latest Exact action wins: email (sent/failed) vs. manual send */}
                        {financeEmailStatus(inv) ? (
                          <ProformaFinanceEmailBadge proforma={inv} />
                        ) : inv.status === "PAID" ? (
                          <ProformaPaidBadge paidAt={inv.paid_at} paidByName={inv.paid_by_name} />
                        ) : (
                          <span className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {formatDateOnly(inv.createdAt)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {(inv.status === "MOVED_TO_FINANCE" || inv.status === "PAID") && (
                            <button
                              type="button"
                              title={t("proforma.viewInvoice")}
                              onClick={() => openProformaInvoiceTab(inv._id)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="View details"
                            onClick={() => {
                              if (onViewInvoice) {
                                onViewInvoice(inv._id);
                              } else {
                                navigate({ to: `/admin/proforma-invoices/${inv._id}` });
                              }
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isFinanceTab && (
                            <RowActionMenu
                              actions={[
                                {
                                  label: "Send to Exact manually",
                                  icon: Send,
                                  disabled: !canSendManually(inv),
                                  onClick: () => setPayTarget(inv),
                                },
                                {
                                  label: canRetryFinanceEmail(inv) ? "Retry" : "Send to Exact via Email",
                                  icon: canRetryFinanceEmail(inv) ? RotateCcw : Mail,
                                  disabled:
                                    !canSendFinanceEmail(inv) ||
                                    preparingPdfId === inv._id ||
                                    (sendFinanceEmailMutation.isPending &&
                                      sendFinanceEmailMutation.variables?.id === inv._id),
                                  onClick: () => sendViaEmail(inv),
                                },
                              ]}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center p-8 text-muted-foreground">
                    No proforma invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />

      {pdfNote && (
        <div aria-hidden className="fixed left-[-10000px] top-0 w-[794px] pointer-events-none">
          <ProformaInvoiceDocument proforma={pdfNote} />
        </div>
      )}

      <MarkProformaPaidDialog
        invoice={payTarget}
        open={Boolean(payTarget)}
        onOpenChange={(open) => {
          if (!open) setPayTarget(null);
        }}
        onConfirm={confirmMarkPaid}
        pending={updateStatusMutation.isPending}
      />
    </div>
  );
}
