import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BadgeCheck, ExternalLink } from "lucide-react";
import moment from "moment";

import { ErrorMessage, LoadingState } from "@/components/common";
import StatusBadge from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import MarkThesisPaidDialog from "@/components/admin/thesis/MarkThesisPaidDialog";
import { useCanModify } from "@/hooks/useCanModify";
import { useGetAdminStudentTheses } from "@/store/useThesisStore";

function eligibilityLabel(item, t) {
  if (item.eligible_by_rules && item.eligible_by_manual) {
    return t("studentManagement.thesis.eligibilityBoth", "Rules + Manual");
  }
  if (item.eligible_by_manual) {
    return t("studentManagement.thesis.eligibilityManual", "Manual");
  }
  if (item.eligible_by_rules) {
    return t("studentManagement.thesis.eligibilityRules", "Rules");
  }
  return t("studentManagement.thesis.eligibilityNone", "—");
}

function attemptLabel(status, t) {
  if (!status) return "—";
  if (status === "active") {
    return t("studentManagement.thesis.attemptActive", "Active");
  }
  if (status === "failed") {
    return t("studentManagement.thesis.attemptFailed", "Failed");
  }
  if (status === "passed") {
    return t("studentManagement.thesis.attemptPassed", "Passed");
  }
  return status;
}

function detailPath(item, userId) {
  if (!item?.trajectory?._id || !userId) return null;
  const base =
    item.type === "master" ? "/admin/master-thesis" : "/admin/thesis";
  return `${base}/${item._id}/trajectories/${item.trajectory._id}/students/${userId}`;
}

function markedPaidAudit(markedPaid, t) {
  const admin = markedPaid?.marked_paid_by;
  if (!admin) return null;
  const name =
    `${admin.first_name || ""} ${admin.last_name || ""}`.trim() ||
    admin.email;
  if (!name) return null;
  const date = markedPaid?.marked_paid_at
    ? moment(markedPaid.marked_paid_at).format("DD MMM YYYY")
    : null;
  return t(
    "thesisManagement.markPaid.markedByAudit",
    "Marked paid by {{name}}{{date}}",
    { name, date: date ? ` · ${date}` : "" }
  );
}

function enrolmentStatus(item) {
  if (item.enrolment_status === "purchased") {
    return item.marked_paid?.marked_paid_by ? "marked_paid" : "paid";
  }
  if (item.enrolment_status === "pending") return "pending";
  return "unpaid";
}

function canMarkPaid(item) {
  const eligible = item.eligible_by_rules || item.eligible_by_manual;
  return (
    eligible &&
    (item.enrolment_status === "not_purchased" ||
      item.enrolment_status === "pending")
  );
}

export default function StudentThesisTab({ userId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canModifyDo = useCanModify("/admin/thesis");
  const canModifyMaster = useCanModify("/admin/master-thesis");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [markPaidItem, setMarkPaidItem] = useState(null);

  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetAdminStudentTheses(
    userId,
    { page, limit: rowsPerPage },
    { enabled: !!userId }
  );

  const payload = response?.data;
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];
  const totalCount = response?.total_count ?? payload?.total_count ?? 0;

  if (isLoading && !items.length) {
    return (
      <LoadingState
        text={t("studentManagement.thesis.loading", "Loading theses...")}
      />
    );
  }

  if (error && !items.length) {
    return (
      <ErrorMessage
        message={
          error?.message ||
          t("studentManagement.thesis.loadFailed", "Failed to load theses")
        }
        onRetry={refetch}
      />
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t(
          "studentManagement.thesis.empty",
          "No thesis eligibility or purchases for this student."
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${isFetching ? "opacity-70" : ""}`}>
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("studentManagement.thesis.colThesis", "Thesis")}
              </TableHead>
              <TableHead>
                {t("studentManagement.thesis.colType", "Type")}
              </TableHead>
              <TableHead>
                {t("studentManagement.thesis.colEligibility", "Eligibility")}
              </TableHead>
              <TableHead>
                {t("studentManagement.thesis.colEnrolment", "Enrolment")}
              </TableHead>
              <TableHead>
                {t("studentManagement.thesis.colAttempt", "Attempt")}
              </TableHead>
              <TableHead>
                {t("studentManagement.thesis.colTrajectory", "Trajectory")}
              </TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">
                  {t("common.actions", "Actions")}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const href = detailPath(item, userId);
              const isMaster = item.type === "master";
              const canModify = isMaster ? canModifyMaster : canModifyDo;
              const audit = markedPaidAudit(item.marked_paid, t);
              const actions = [];

              if (canModify && canMarkPaid(item)) {
                actions.push({
                  label: t(
                    "thesisManagement.markPaid.confirm",
                    "Mark as paid"
                  ),
                  icon: BadgeCheck,
                  onClick: () => setMarkPaidItem(item),
                });
              }
              if (href) {
                actions.push({
                  label: t("common.open", "Open"),
                  icon: ExternalLink,
                  onClick: () => navigate({ to: href }),
                });
              }

              return (
                <TableRow key={String(item._id)}>
                  <TableCell>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="font-medium text-foreground truncate max-w-xs">
                        {item.name || "—"}
                      </span>
                      {item.uid ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.uid}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset ${
                        isMaster
                          ? "text-violet-700 ring-violet-500/20 dark:text-violet-300"
                          : "text-sky-700 ring-sky-500/20 dark:text-sky-300"
                      }`}
                    >
                      {isMaster
                        ? t("studentManagement.thesis.typeMaster", "Master")
                        : t("studentManagement.thesis.typeDo", "DO")}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {eligibilityLabel(item, t)}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <StatusBadge status={enrolmentStatus(item)} />
                      {audit ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {audit}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {attemptLabel(item.attempt_status, t)}
                    {item.attempt_number ? (
                      <span className="text-xs text-muted-foreground ml-1">
                        #{item.attempt_number}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.trajectory?.name || "—"}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RowActionMenu actions={actions} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 ? (
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={(value) => {
            setRowsPerPage(value);
            setPage(1);
          }}
          totalRows={totalCount}
        />
      ) : null}

      <MarkThesisPaidDialog
        open={Boolean(markPaidItem)}
        onOpenChange={(open) => {
          if (!open) setMarkPaidItem(null);
        }}
        thesisId={markPaidItem?._id}
        thesisName={markPaidItem?.name}
        userId={userId}
        onDone={() => refetch()}
      />
    </div>
  );
}
