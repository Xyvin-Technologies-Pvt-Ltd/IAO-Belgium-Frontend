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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";
import { toast } from "sonner";
import { UserPlus, UserMinus, Download, Pause, Ban, Play } from "lucide-react";
import {
  useGetBatchesById,
  useGetStudentsByBatch,
} from "@/store/useBatchStore";
import { useCanModify } from "@/hooks/useCanModify";
import { getStudentByBatch } from "@/api/batchApi";
import { buildCsv, downloadCsv } from "@/utils/exportCsv";
import AddStudentsFromCoachViewDialog from "./AddStudentsFromCoachViewDialog";
import RemoveStudentFromBatchDialog from "./RemoveStudentFromBatchDialog";
import PauseStopEnrollmentDialog from "./PauseStopEnrollmentDialog";
import ResumeEnrollmentDialog from "./ResumeEnrollmentDialog";
import RowActionMenu from "@/components/ui/table/RowActionMenu";

const BatchStudentList = () => {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const id = params.id;
  const { t } = useTranslation();
  const canModify = useCanModify("operations");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const debouncedSearch = useDebounce(search, 500);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [removingStudent, setRemovingStudent] = useState(null);
  const [holdDialog, setHoldDialog] = useState({ open: false, mode: "pause", student: null });
  const [resumeStudent, setResumeStudent] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data: batch } = useGetBatchesById(id);
  const { data, isLoading, error, refetch, isFetching } = useGetStudentsByBatch(
    id,
    {
      page: page,
      limit: rowsPerPage,
      year_status: statusFilter,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    },
  );

  const students = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (appId) => {
    navigate({
      to: "/admin/admission-administration/academics/intakes/batch/student/$id",
      params: { id: appId },
    });
  };

  const handleExport = async () => {
    const toastId = toast.loading(t("studentManagement.exporting", "Preparing CSV export..."));
    try {
      const response = await getStudentByBatch(id, {
        year_status: statusFilter,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        export: true,
      });
      const rows = response?.data || [];
      if (rows.length === 0) {
        toast.error(t("studentManagement.exportEmpty", "No students to export."), { id: toastId });
        return;
      }
      const csv = buildCsv(
        [
          t("studentManagement.table.studentName"),
          t("studentManagement.table.email"),
          t("studentManagement.table.status"),
        ],
        rows,
        (r) => [
          [r.first_name, r.last_name].filter(Boolean).join(" "),
          r.email,
          r.year_status || r.status,
        ],
      );
      downloadCsv(csv, `${batch?.data?.name || "group"}_students`);
      toast.success(t("studentManagement.exportSuccess", "Students exported successfully!"), { id: toastId });
    } catch (err) {
      toast.error(err?.message || t("studentManagement.exportFailed", "Failed to export students."), {
        id: toastId,
      });
    }
  };

  const renderActions = (student) => {
    if (!canModify) return null;
    const yearStatus = student?.year_status || "active";

    if (yearStatus === "paused" || yearStatus === "stopped") {
      return (
        <RowActionMenu
          actions={[
            {
              label: t("enrollmentHold.confirmResume", "Resume"),
              onClick: () => setResumeStudent(student),
              icon: Play,
            },
            ...(yearStatus === "paused"
              ? [
                  {
                    label: t("enrollmentHold.confirmStop", "Stop"),
                    onClick: () =>
                      setHoldDialog({ open: true, mode: "stop", student }),
                    icon: Ban,
                  },
                ]
              : []),
          ]}
        />
      );
    }

    // In-group / active
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          title={t("enrollmentHold.pauseTitle", "Pause enrollment")}
          onClick={() => setHoldDialog({ open: true, mode: "pause", student })}
        >
          <Pause className="h-4 w-4 text-amber-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title={t("enrollmentHold.stopTitle", "Stop enrollment")}
          onClick={() => setHoldDialog({ open: true, mode: "stop", student })}
        >
          <Ban className="h-4 w-4 text-red-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title={t("removeStudent.button", "Remove from group")}
          onClick={() => setRemovingStudent(student)}
        >
          <UserMinus className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Input
            placeholder={t("studentManagement.search")}
            className="h-9 w-full max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[9.5rem] shrink-0">
              <SelectValue
                placeholder={t("enrollmentHold.statusFilter", "Status")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("enrollmentHold.filterAll", "All")}
              </SelectItem>
              <SelectItem value="active">
                {t("enrollmentHold.filterActive", "Active (in group)")}
              </SelectItem>
              <SelectItem value="paused">
                {t("enrollmentHold.filterPaused", "Paused")}
              </SelectItem>
              <SelectItem value="stopped">
                {t("enrollmentHold.filterStopped", "Stopped")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="flex h-9 items-center gap-2">
            <Download className="h-4 w-4" />
            {t("studentManagement.exportCsv", "Export CSV")}
          </Button>
          {canModify && (
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(true)}
              className="flex h-9 items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {t("addStudents.button", "Add students")}
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("studentManagement.table.studentId")}</TableHead>
            <TableHead>{t("studentManagement.table.studentName")}</TableHead>
            <TableHead>{t("studentManagement.table.email")}</TableHead>
            <TableHead>{t("studentManagement.table.enrolledDate")}</TableHead>
            <TableHead>{t("studentManagement.table.status")}</TableHead>
            {canModify && <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={canModify ? 6 : 5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={canModify ? 6 : 5} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("studentManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : students?.length > 0 ? (
            students?.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell className={"capitalize"}>
                  {i?.last_name} {i?.first_name}
                </TableCell>
                <TableCell>{i?.email}</TableCell>
                <TableCell>
                  {i?.enrolled_date
                    ? moment(i.enrolled_date).format("DD-MM-YYYY")
                    : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.year_status || i?.status} />
                </TableCell>
                {canModify && (
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {renderActions(i)}
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={canModify ? 6 : 5} className="text-center">
                {t("studentManagement.table.noStudents")}
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

      {canModify && (
        <>
          <AddStudentsFromCoachViewDialog
            open={isAddDialogOpen}
            batch={batch?.data}
            onClose={() => setIsAddDialogOpen(false)}
          />
          <RemoveStudentFromBatchDialog
            open={!!removingStudent}
            batchId={id}
            application={removingStudent}
            onClose={() => setRemovingStudent(null)}
          />
          <PauseStopEnrollmentDialog
            open={holdDialog.open}
            mode={holdDialog.mode}
            application={holdDialog.student}
            batchId={id}
            onClose={() => setHoldDialog({ open: false, mode: "pause", student: null })}
          />
          <ResumeEnrollmentDialog
            open={!!resumeStudent}
            onOpenChange={(open) => !open && setResumeStudent(null)}
            student={resumeStudent}
            batchId={id}
          />
        </>
      )}
    </div>
  );
};

export default BatchStudentList;
