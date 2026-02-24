import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useTranslation } from "react-i18next";
import AssignmentForm from "@/components/admin/exam-assignment/AssignmentForm";
import {
  useGetExamAssignments,
  useCancelExamAssignment,
} from "@/store/useExamAssignmentStore";
import { useNavigate } from "@tanstack/react-router";

const statusStyles = {
  scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const ExamsAssignments = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const { data, isLoading, error, refetch, isFetching } = useGetExamAssignments(
    {
      page,
      limit: rowsPerPage,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
  );
  const cancelAssignment = useCancelExamAssignment();

  const assignments = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedAssignment(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    if (a.status === "cancelled") return;
    setSelectedAssignment(a);
    setIsModalOpen(true);
  };

  const handleCancel = async (a) => {
    try {
      await cancelAssignment.mutateAsync(a._id);
      refetch();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleRowClick = (id) => {
    navigate({
      to: "/admin/examination/assignments/$id",
      params: { id },
    });
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("examAssignment.title")}
      </h2>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("examAssignment.allStatuses")}</option>
          <option value="scheduled">{t("examAssignment.status.scheduled")}</option>
          <option value="active">{t("examAssignment.status.active")}</option>
          <option value="completed">{t("examAssignment.status.completed")}</option>
          <option value="cancelled">{t("examAssignment.status.cancelled")}</option>
        </select>
        <Button onClick={handleOpenCreate}>
          {t("examAssignment.createAssignment")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("examAssignment.table.uid")}</TableHead>
            <TableHead>{t("examAssignment.table.exam")}</TableHead>
            <TableHead>{t("examAssignment.table.program")}</TableHead>
            <TableHead>{t("examAssignment.table.batch")}</TableHead>
            <TableHead>{t("examAssignment.table.startDate")}</TableHead>
            <TableHead>{t("examAssignment.table.endDate")}</TableHead>
            <TableHead>{t("examAssignment.table.status")}</TableHead>
            <TableHead>{t("examAssignment.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={8} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("examAssignment.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : assignments?.length > 0 ? (
            assignments?.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell>{i?.exam?.name || "-"}</TableCell>
                <TableCell>{i?.program?.name || "-"}</TableCell>
                <TableCell>{i?.batch?.name || "-"}</TableCell>
                <TableCell>
                  {i?.start_date
                    ? new Date(i.start_date).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  {i?.end_date
                    ? new Date(i.end_date).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusStyles[i?.status] || statusStyles.scheduled
                    }`}
                  >
                    {t(`examAssignment.status.${i?.status || "scheduled"}`)}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      ...(i?.status !== "cancelled"
                        ? [
                            {
                              label: t("examAssignment.table.edit"),
                              icon: Edit,
                              onClick: () => handleOpenEdit(i),
                            },
                            {
                              label: t("examAssignment.table.cancel"),
                              onClick: () => handleCancel(i),
                            },
                          ]
                        : []),
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                {t("examAssignment.table.noAssignments")}
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

      <AssignmentForm
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignmentData={selectedAssignment}
        onSuccess={() => {
          setSelectedAssignment(null);
          setIsModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default ExamsAssignments;
