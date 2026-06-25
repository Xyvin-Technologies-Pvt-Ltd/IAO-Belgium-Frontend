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
import { Badge } from "@/components/ui/badge";
import {
  useGetExams,
  usePublishExam,
  useArchiveExam,
} from "@/store/useExamStore";
import { useGetAllLanguages } from "@/store/useDropdownStore";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

const Exams = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data: languagesData } = useGetAllLanguages({ status: true });
  const languages = languagesData?.data || [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, languageFilter]);

  const { data, isLoading, error, refetch, isFetching } = useGetExams({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(languageFilter ? { exam_language: languageFilter } : {}),
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

  const getTypeBadge = (type = "online") => {
    if (type === "sit-at-home") {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {t("exam.form.sitAtHome", "Sit-at-home")}
        </Badge>
      );
    }
    if (type === "practical") {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          {t("exam.form.practical", "Practical")}
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        {t("exam.form.online", "Online")}
      </Badge>
    );
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
          <Select value={statusFilter || undefined} onValueChange={(value) => setStatusFilter(value || "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("exam.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{t("exam.status.draft")}</SelectItem>
              <SelectItem value="published">{t("exam.status.published")}</SelectItem>
              <SelectItem value="archived">{t("exam.status.archived")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={languageFilter || undefined} onValueChange={(value) => setLanguageFilter(value || "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("exam.allLanguages")} />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang._id} value={lang._id}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleOpenCreate}>{t("exam.createExam")}</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("exam.table.uid")}</TableHead>
            <TableHead>{t("exam.table.name")}</TableHead>
            <TableHead>{t("exam.table.type", "Type")}</TableHead>
            <TableHead>{t("exam.table.questions")}</TableHead>
            <TableHead>{t("exam.table.duration")}</TableHead>
            <TableHead>{t("exam.table.passingMarks")}</TableHead>
            <TableHead>{t("exam.table.language")}</TableHead>
            <TableHead>{t("exam.table.status")}</TableHead>
            <TableHead>{t("exam.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={9} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center p-8">
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
                <TableCell>{getTypeBadge(i?.type)}</TableCell>
                <TableCell>{i?.total_questions ?? 0}</TableCell>
                <TableCell>{i?.duration ?? 0} {t("common.min")}</TableCell>
                <TableCell>
                  {i?.passing_type === "percentage"
                    ? `${i?.passing_percentage ?? i?.passing_marks ?? 0}%`
                    : i?.passing_marks ?? i?.passing_percentage ?? 0}
                </TableCell>
                <TableCell>{i?.exam_language?.name || "-"}</TableCell>
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
              <TableCell colSpan={9} className="text-center">
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
