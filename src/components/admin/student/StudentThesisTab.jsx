import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

import { ErrorMessage, LoadingState } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Pagination } from "@/components/ui/table/Pagination";
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

function enrolmentLabel(status, t) {
  if (status === "purchased") {
    return t("studentManagement.thesis.enrolmentPurchased", "Purchased");
  }
  if (status === "pending") {
    return t("studentManagement.thesis.enrolmentPending", "Pending payment");
  }
  return t("studentManagement.thesis.enrolmentNotPurchased", "Not purchased");
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

export default function StudentThesisTab({ userId }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  if (error) {
    return (
      <ErrorMessage
        message={
          error?.message ||
          t("studentManagement.thesis.loadFailed", "Failed to load theses")
        }
        onRetry={refetch}
        variant="inline"
      />
    );
  }

  if (!items.length && totalCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {t(
            "studentManagement.thesis.empty",
            "No thesis eligibility or purchases for this student."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={isFetching ? "opacity-60 pointer-events-none" : ""}>
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
              <TableHead className="text-right">
                {t("common.actions", "Actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const href = detailPath(item, userId);
              const isMaster = item.type === "master";
              return (
                <TableRow key={String(item._id)}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate max-w-xs">
                        {item.name || "—"}
                      </p>
                      {item.uid ? (
                        <p className="text-xs text-muted-foreground">
                          {item.uid}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isMaster
                          ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20"
                          : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20"
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
                  <TableCell className="text-sm">
                    {enrolmentLabel(item.enrolment_status, t)}
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
                  <TableCell className="text-right">
                    {href ? (
                      <Button
                        asChild
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 cursor-pointer"
                      >
                        <Link to={href}>
                          {t("common.open", "Open")}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
    </div>
  );
}
