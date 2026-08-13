import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
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
import { useGetEnrolledStudentsByIntake } from "@/store/useIntakeStore";
import { formatTZ } from "@/utils/dateUtils";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import MoveStudentDialog from "./MoveStudentDialog";
import ReEnrollStudentDialog from "./ReEnrollStudentDialog";
import PauseStopEnrollmentDialog from "@/components/admin/batch/PauseStopEnrollmentDialog";
import ResumeEnrollmentDialog from "@/components/admin/batch/ResumeEnrollmentDialog";

const StudentList = () => {
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [reEnrollDialogOpen, setReEnrollDialogOpen] = useState(false);
  const [holdDialog, setHoldDialog] = useState({ open: false, mode: "pause", student: null });
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data, isLoading, error, refetch, isFetching } =
    useGetEnrolledStudentsByIntake(id, {
      page: page,
      limit: rowsPerPage,
      year_status: statusFilter,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    });

  const students = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (appId) => {
    navigate({
      to: "/admin/admission-administration/academics/intakes/student/$id",
      params: { id: appId },
    });
  };

  const handleMoveStudent = (student) => {
    setSelectedStudent(student);
    setMoveDialogOpen(true);
  };

  const handleReEnrollStudent = (student) => {
    setSelectedStudent(student);
    setReEnrollDialogOpen(true);
  };

  const handleResumeStudent = (student) => {
    setSelectedStudent(student);
    setResumeDialogOpen(true);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("studentManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("studentManagement.table.studentId")}</TableHead>
            <TableHead>{t("studentManagement.table.studentName")}</TableHead>
            <TableHead>{t("studentManagement.table.email")}</TableHead>
            <TableHead>{t("studentManagement.table.batch")}</TableHead>
            <TableHead>{t("studentManagement.table.enrolledDate")}</TableHead>
            <TableHead>{t("studentManagement.table.status")}</TableHead>
            <TableHead>{t("batchManagement.actions.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={7} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
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
                <TableCell>{i?.batch_name || "—"}</TableCell>
                <TableCell>
                  {formatTZ(i?.enrolled_date, "DD-MM-YYYY") || t("common.notAvailable")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.year_status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      ...(i.year_status === "active"
                        ? [
                            {
                              label: t("batchManagement.actions.moveToAnotherBatch"),
                              onClick: (e) => {
                                e.stopPropagation();
                                handleMoveStudent(i);
                              },
                            },
                            {
                              label: t("enrollmentHold.confirmPause", "Pause"),
                              onClick: (e) => {
                                e.stopPropagation();
                                setHoldDialog({ open: true, mode: "pause", student: i });
                              },
                            },
                            {
                              label: t("enrollmentHold.confirmStop", "Stop"),
                              onClick: (e) => {
                                e.stopPropagation();
                                setHoldDialog({ open: true, mode: "stop", student: i });
                              },
                            },
                          ]
                        : []),
                      ...(i.year_status === "failed"
                        ? [
                            {
                              label: t(
                                "batchManagement.actions.reEnrollStudent",
                                "Re-enroll for Failed Year",
                              ),
                              onClick: (e) => {
                                e.stopPropagation();
                                handleReEnrollStudent(i);
                              },
                            },
                          ]
                        : []),
                      ...(i.year_status === "paused" || i.year_status === "stopped"
                        ? [
                            {
                              label: t("enrollmentHold.confirmResume", "Resume"),
                              onClick: (e) => {
                                e.stopPropagation();
                                handleResumeStudent(i);
                              },
                            },
                            ...(i.year_status === "paused"
                              ? [
                                  {
                                    label: t("enrollmentHold.confirmStop", "Stop"),
                                    onClick: (e) => {
                                      e.stopPropagation();
                                      setHoldDialog({
                                        open: true,
                                        mode: "stop",
                                        student: i,
                                      });
                                    },
                                  },
                                ]
                              : []),
                          ]
                        : []),
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
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

      <MoveStudentDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        student={selectedStudent}
      />

      <ReEnrollStudentDialog
        open={reEnrollDialogOpen}
        onOpenChange={setReEnrollDialogOpen}
        student={selectedStudent}
      />

      <PauseStopEnrollmentDialog
        open={holdDialog.open}
        mode={holdDialog.mode}
        application={holdDialog.student}
        batchId={holdDialog.student?.batch_id}
        onClose={() => setHoldDialog({ open: false, mode: "pause", student: null })}
      />

      <ResumeEnrollmentDialog
        open={resumeDialogOpen}
        onOpenChange={setResumeDialogOpen}
        student={selectedStudent}
        batchId={selectedStudent?.batch_id || selectedStudent?.previous_batch}
      />
    </div>
  );
};

export default StudentList;
