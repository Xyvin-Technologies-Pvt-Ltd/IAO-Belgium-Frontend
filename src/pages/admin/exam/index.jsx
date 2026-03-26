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
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import ExamForm from "@/components/admin/exam/ExamForm";
import StatusBadge from "@/components/StatusBadge";
import {
  useGetExams,
  usePublishExam,
  useArchiveExam,
} from "@/store/useExamStore";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

const Exams = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data, isLoading, error, refetch, isFetching } = useGetExams({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const publishExam = usePublishExam();
  const archiveExam = useArchiveExam();

  const exams = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedExam(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam) => {
    if (exam.status === "published") {
      toast.error(t("exam.cannotEditPublished"));
      return;
    }
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  const handlePublish = async (exam) => {
    try {
      await publishExam.mutateAsync(exam._id);
      refetch();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleArchive = async (exam) => {
    try {
      await archiveExam.mutateAsync(exam._id);
      refetch();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleRowClick = (id) => {
    navigate({
      to: "/admin/examination/exams/$id",
      params: { id },
    });
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("exam.title")}
      </h2>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder={t("exam.search")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("exam.allStatuses")}</option>
            <option value="draft">{t("exam.status.draft")}</option>
            <option value="published">{t("exam.status.published")}</option>
            <option value="archived">{t("exam.status.archived")}</option>
          </select>
        </div>
        <Button onClick={handleOpenCreate}>{t("exam.createExam")}</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("exam.table.uid")}</TableHead>
            <TableHead>{t("exam.table.name")}</TableHead>
            <TableHead>{t("exam.table.questions")}</TableHead>
            <TableHead>{t("exam.table.duration")}</TableHead>
            <TableHead>{t("exam.table.passingMarks")}</TableHead>
            <TableHead>{t("exam.table.status")}</TableHead>
            <TableHead>{t("exam.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={7} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("exam.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : exams?.length > 0 ? (
            exams?.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.total_questions ?? 0}</TableCell>
                <TableCell>{i?.duration ?? 0} min</TableCell>
                <TableCell>{i?.passing_marks ?? 0}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      ...(i?.status === "draft"
                        ? [
                            {
                              label: t("exam.table.edit"),
                              icon: Edit,
                              onClick: () => handleOpenEdit(i),
                            },
                            {
                              label: t("exam.table.publish"),
                              onClick: () => handlePublish(i),
                            },
                            {
                              label: t("exam.table.archive"),
                              onClick: () => handleArchive(i),
                            },
                          ]
                        : i?.status === "published"
                          ? [
                              {
                                label: t("exam.table.archive"),
                                onClick: () => handleArchive(i),
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
              <TableCell colSpan={7} className="text-center">
                {t("exam.table.noExams")}
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

      <ExamForm
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        examData={selectedExam}
        onSuccess={() => {
          setSelectedExam(null);
          setIsModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default Exams;
