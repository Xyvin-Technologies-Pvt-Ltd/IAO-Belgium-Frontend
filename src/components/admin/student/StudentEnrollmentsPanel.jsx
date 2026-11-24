import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";

function resolveTargetPath(pathname, applicationId) {
  if (!applicationId) return null;

  if (pathname?.startsWith("/admin/student-management")) {
    return {
      to: "/admin/student-management/$id",
      params: { id: String(applicationId) },
    };
  }

  if (pathname?.includes("/intakes/batch/student")) {
    return {
      to: "/admin/admission-administration/academics/intakes/batch/student/$id",
      params: { id: String(applicationId) },
    };
  }

  if (pathname?.includes("/intakes/student")) {
    return {
      to: "/admin/admission-administration/academics/intakes/student/$id",
      params: { id: String(applicationId) },
    };
  }

  return {
    to: "/admin/student-management/$id",
    params: { id: String(applicationId) },
  };
}

/**
 * Lists all enrollments for a student and opens each application separately.
 * Uses student.data.applications from the multi-enrollment backend payload.
 */
export default function StudentEnrollmentsPanel({
  applications = [],
  currentApplicationId,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const list = Array.isArray(applications) ? applications : [];
  //* Single enrollment: program/batch already shown on the page — no strip.
  if (list.length < 2) return null;

  const currentId = currentApplicationId ? String(currentApplicationId) : null;

  const openEnrollment = (applicationId) => {
    const target = resolveTargetPath(pathname, applicationId);
    if (!target) return;
    navigate(target);
  };

  return (
    <div className="rounded-lg border border-sidebar-border bg-background/40 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {t("studentManagement.enrollments.title", "Enrollments")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t(
            "studentManagement.enrollments.subtitle",
            "This student has multiple enrollments. Open one to manage it separately.",
          )}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("studentManagement.enrollments.program", "Program")}
              </TableHead>
              <TableHead>
                {t("studentManagement.enrollments.batch", "Batch")}
              </TableHead>
              <TableHead>
                {t("studentManagement.enrollments.status", "Status")}
              </TableHead>
              <TableHead>
                {t("studentManagement.enrollments.yearStatus", "Year status")}
              </TableHead>
              <TableHead>
                {t("studentManagement.enrollments.year", "Year")}
              </TableHead>
              <TableHead>
                {t("studentManagement.enrollments.uid", "App UID")}
              </TableHead>
              <TableHead className="text-right">
                {t("common.actions", "Actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((app) => {
              const appId = String(app._id);
              const isCurrent = currentId && appId === currentId;
              const programName =
                app.program?.name ||
                app.intake?.name ||
                t("common.enrollment", "Enrollment");

              return (
                <TableRow
                  key={appId}
                  className={isCurrent ? "bg-orange-50/70 dark:bg-orange-950/20" : ""}
                >
                  <TableCell className="font-medium">
                    {programName}
                    {isCurrent ? (
                      <span className="ml-2 text-xs text-[#ff8904]">
                        {t("studentManagement.enrollments.current", "Current")}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{app.batch?.name || "—"}</TableCell>
                  <TableCell>
                    {app.status ? <StatusBadge status={app.status} /> : "—"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {app.year_status
                      ? String(app.year_status).replace(/_/g, " ")
                      : "—"}
                  </TableCell>
                  <TableCell>{app.current_year ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {app.uid || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant={isCurrent ? "outline" : "default"}
                      size="sm"
                      disabled={isCurrent}
                      onClick={() => openEnrollment(appId)}
                    >
                      {isCurrent
                        ? t("studentManagement.enrollments.viewing", "Viewing")
                        : t("studentManagement.enrollments.open", "Open")}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

