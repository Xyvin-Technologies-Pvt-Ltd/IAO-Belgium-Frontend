import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import StatusBadge from "@/components/StatusBadge";
import { useModuleReattempts } from "@/store/useYearCompletionStore";
import ModuleReattemptDialog from "@/components/admin/batch/ModuleReattemptDialog";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { formatInstant } from "@/utils/dateUtils";

const ModuleReattemptsPage = () => {
  const { t } = useTranslation();
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [status, setStatus] = useState("pending");
  const [assignTarget, setAssignTarget] = useState(null);

  useEffect(() => {
    updateBreadcrumbs([
      {
        label: t("common.admissionAdministration", "Admission Administration"),
        path: "/admin/admission-administration",
        navigable: false,
      },
      {
        label: t("yearCompletion.reattemptQueue", "Module reattempts"),
        path: "/admin/module-reattempts",
        navigable: false,
      },
    ]);
    return () => updateBreadcrumbs([]);
  }, [t, updateBreadcrumbs]);

  const { data, isLoading, error, refetch, isFetching } = useModuleReattempts({
    page,
    limit: rowsPerPage,
    status,
  });

  const rows = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {t("yearCompletion.reattemptQueue", "Module reattempts")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "yearCompletion.reattemptQueueHint",
              "Students who requested a new group for a module.",
            )}
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              {t("yearCompletion.filterPending", "Pending")}
            </SelectItem>
            <SelectItem value="assigned">
              {t("yearCompletion.filterAssigned", "Assigned")}
            </SelectItem>
            <SelectItem value="all">{t("common.all", "All")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("studentManagement.table.studentName", "Student")}</TableHead>
              <TableHead>{t("common.batch", "Group")}</TableHead>
              <TableHead>{t("yearCompletion.modules", "Module")}</TableHead>
              <TableHead>{t("yearCompletion.reason", "Reason")}</TableHead>
              <TableHead>{t("common.status", "Status")}</TableHead>
              <TableHead>{t("yearCompletion.date", "Date")}</TableHead>
              <TableHead className="text-center">
                {t("common.actions", "Actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-50" : ""}>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={7} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="p-8 text-center">
                  <ErrorMessage
                    message={error?.message}
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="capitalize">
                    {row.application?.user?.last_name}{" "}
                    {row.application?.user?.first_name}
                  </TableCell>
                  <TableCell>{row.application?.batch?.name || "—"}</TableCell>
                  <TableCell>
                    {row.component?.name || "—"}
                    {row.component?.year != null
                      ? ` (Y${row.component.year})`
                      : ""}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.reason} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatInstant(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setAssignTarget({
                            applicationId: row.application?._id,
                            componentId: row.component?._id,
                            moduleName: row.component?.name,
                          })
                        }
                      >
                        {t("yearCompletion.assignGroup", "Assign group")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  {t("yearCompletion.noPending", "No pending reattempts.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalRows > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalRows={totalRows}
        />
      )}

      <ModuleReattemptDialog
        open={!!assignTarget}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        applicationId={assignTarget?.applicationId}
        componentId={assignTarget?.componentId}
        moduleName={assignTarget?.moduleName}
        onDone={refetch}
      />
    </div>
  );
};

export default ModuleReattemptsPage;
