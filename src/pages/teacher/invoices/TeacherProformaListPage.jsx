import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetFinanceQueue } from "@/store/useProformaStore";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import { FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { coursePlanningLabel } from "@/utils/proformaCourseLabel";

export default function TeacherProformaListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: queueData, isLoading, isFetching } = useGetFinanceQueue({
    page,
    limit: rowsPerPage,
    status: statusFilter,
  });

  const invoices = queueData?.data || [];
  const totalRows = queueData?.total_count || 0;

  const statusBadges = {
    SENT_TO_TEACHER: {
      label: "Needs your confirm & sign",
      bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
      icon: Clock,
    },
    CHANGE_REQUESTED: {
      label: "Update in progress",
      bg: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300",
      icon: AlertCircle,
    },
    TEACHER_SIGNED_APPROVED: {
      label: "Signed — awaiting finance",
      bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
      icon: CheckCircle2,
    },
    MOVED_TO_FINANCE: {
      label: "In finance",
      bg: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300",
      icon: CheckCircle2,
    },
    PAID: {
      label: "Paid",
      bg: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300",
      icon: CheckCircle2,
    },
  };

  const getStatusBadge = (inv) => {
    if (inv.status === "CHANGE_REQUESTED") {
      const awaitingYou = inv.workflow_next_actor !== "ADMIN";
      return {
        label: awaitingYou ? "Awaiting your action" : "Awaiting admin review",
        bg: statusBadges.CHANGE_REQUESTED.bg,
        icon: AlertCircle,
      };
    }
    return (
      statusBadges[inv.status] || {
        label: inv.status,
        bg: "bg-muted text-muted-foreground",
        icon: Clock,
      }
    );
  };

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6 mt-4 pb-12 w-full max-w-full">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" />
          {t("proforma.myInvoices")}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review, digitally sign, and manage your course proforma invoices and claim reimbursements
        </p>
      </div>

      <div className="flex border-b border-border gap-6 text-sm font-medium flex-wrap">
        <button
          onClick={() => {
            setStatusFilter("ALL");
            resetPage();
          }}
          className={`pb-3 border-b-2 transition ${
            statusFilter === "ALL"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Invoices
        </button>

        <button
          onClick={() => {
            setStatusFilter("SENT_TO_TEACHER,CHANGE_REQUESTED");
            resetPage();
          }}
          className={`pb-3 border-b-2 transition ${
            statusFilter === "SENT_TO_TEACHER,CHANGE_REQUESTED"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Action Required (Needs Review / Signature)
        </button>

        <button
          onClick={() => {
            setStatusFilter("TEACHER_SIGNED_APPROVED");
            resetPage();
          }}
          className={`pb-3 border-b-2 transition ${
            statusFilter === "TEACHER_SIGNED_APPROVED"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Signed & Submitted
        </button>

        <button
          onClick={() => {
            setStatusFilter("MOVED_TO_FINANCE");
            resetPage();
          }}
          className={`pb-3 border-b-2 transition ${
            statusFilter === "MOVED_TO_FINANCE"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          In Finance Queue
        </button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Invoice #</TableHead>
              <TableHead>Course Planning</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={6} />
            ) : invoices.length > 0 ? (
              invoices.map((inv) => {
                const badge = getStatusBadge(inv);
                const BadgeIcon = badge.icon;
                const { title, subtitle, locationLines } = coursePlanningLabel(inv);

                return (
                  <TableRow key={inv._id} className="hover:bg-muted/40 transition">
                    <TableCell className="font-semibold text-foreground font-mono">{inv.proforma_number}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {title}
                      {subtitle && (
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">{subtitle}</span>
                      )}
                      {locationLines.length > 0 && (
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                          {locationLines.join(" · ")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium text-xs">
                      {inv.region_snapshot_name}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      €{inv.grand_total?.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-semibold border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <Button
                        size="sm"
                        className={
                          inv.status === "SENT_TO_TEACHER"
                            ? "bg-amber-700 hover:bg-amber-800 text-white font-semibold"
                            : "variant-outline"
                        }
                        variant={inv.status === "SENT_TO_TEACHER" ? "default" : "outline"}
                        onClick={() => navigate({ to: `/teacher/proforma-invoices/${inv._id}` })}
                      >
                        {inv.status === "SENT_TO_TEACHER"
                          ? t("proforma.list.viewAndSign")
                          : t("common.viewDetails", { defaultValue: "View Details" })}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                  {t("proforma.list.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
