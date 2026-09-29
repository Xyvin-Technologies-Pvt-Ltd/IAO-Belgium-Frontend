import React, { useState, useEffect } from "react";
import { useGetFinanceQueue, useGetProformaErrors, useTriggerPlanningProformaTest } from "@/store/useProformaStore";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import TemporaryProformaTestTrigger from "./TemporaryProformaTestTrigger";
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
  const navigate = useNavigate();
  const triggerTestMutation = useTriggerPlanningProformaTest();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data: queueData, isLoading: loadingQueue, isFetching: fetchingQueue, refetch: refetchQueue } = useGetFinanceQueue({
    page,
    limit: rowsPerPage,
    status: statusFilter,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }, { enabled: statusFilter !== "ERRORS" });

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
      label: "Signed — ready to accept",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    MOVED_TO_FINANCE: {
      label: "In finance",
      bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400",
    },
    PAID: {
      label: "Paid",
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
    return statusBadges[inv.status] || { label: inv.status, bg: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-dashboard-text dark:text-white">
            Teacher Proforma Invoices
          </h1>
        </div>

        {/* Search Input */}
        <div>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or region..."
            className="w-72"
          />
        </div>
      </div>

      {/* Temporary Test Tool (Separate File) */}
      <TemporaryProformaTestTrigger
        onTriggerSuccess={() => {
          refetchQueue?.();
          refetchErrors?.();
        }}
      />

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
          All Invoices
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
                      {err.teacher_id?.full_name || err.teacher_id?.name || "Teacher"}
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
                          disabled={triggerTestMutation.isPending}
                          onClick={() => {
                            const pId = err.planning_id?._id || err.planning_id;
                            if (pId) {
                              triggerTestMutation.mutate(pId);
                            }
                          }}
                        >
                          {triggerTestMutation.isPending ? "Retrying..." : "Retry Invoice"}
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
                    No invoice generation errors found. All plannings were processed cleanly.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Invoice #</TableHead>
                <TableHead>Teacher Name & Email</TableHead>
                <TableHead>Course / Region</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Last Updated</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
              {isLoading ? (
                <TableSkeleton rows={rowsPerPage} columns={7} />
              ) : invoices.length > 0 ? (
                invoices.map((inv) => {
                  const badge = getStatusBadge(inv);

                  return (
                    <TableRow key={inv._id} className="hover:bg-muted/40 transition">
                      <TableCell className="font-semibold text-foreground">{inv.proforma_number}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {inv.teacher_id?.full_name || inv.teacher_id?.name || "Teacher"}
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">{inv.teacher_id?.email}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {inv.region_snapshot_name}
                        {inv.planning_id?.city && (
                          <span className="block text-xs text-muted-foreground font-normal mt-0.5">City: {inv.planning_id.city}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        €{inv.grand_total?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(inv.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (onViewInvoice) {
                              onViewInvoice(inv._id);
                            } else {
                              navigate({ to: `/admin/proforma-invoices/${inv._id}` });
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-8 text-muted-foreground">
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
    </div>
  );
}
