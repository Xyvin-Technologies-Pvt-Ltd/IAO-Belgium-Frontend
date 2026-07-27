import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useTranslation } from "react-i18next";
import QuestionForm from "./QuestionForm";
import BulkUploadDialog from "./BulkUploadDialog";
import DeleteConfirm from "@/components/DeleteConfirm";
import {
  useGetQuestions,
  useDeleteQuestion,
} from "@/store/useQuestionBankStore";
import moment from "moment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { useCanModify } from "@/hooks/useCanModify";

const DIFFICULTY_LABELS = {
  remember: "Remember",
  understand: "Understand",
  apply: "Apply",
  analyze: "Analyze",
  evaluate: "Evaluate",
  create: "Create",
};

const QuestionList = ({ questionBankId }) => {
  const { t } = useTranslation();
  const canModify = useCanModify("operations");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [difficulty, setDifficulty] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteIds, setDeleteIds] = useState({ bankId: null, questionId: null });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data, isLoading, error, refetch, isFetching } = useGetQuestions(
    questionBankId,
    {
      page,
      limit: rowsPerPage,
      ...(difficulty && difficulty !== "all" ? { difficulty } : {}),
      sort_by: sortBy,
      sort_order: sortOrder,
    },
  );
  const { mutateAsync: deleteQuestion, isPending: isDeleting } =
    useDeleteQuestion();

  const questions = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenAdd = () => {
    setSelectedQuestion(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (q) => {
    setSelectedQuestion(q);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (q) => {
    setDeleteIds({ bankId: questionBankId, questionId: q._id });
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteQuestion({
        questionBankId: deleteIds.bankId,
        questionId: deleteIds.questionId,
      });
    } finally {
      setDeleteIds({ bankId: null, questionId: null });
      setOpenDelete(false);
    }
  };

  const handleFormSuccess = () => {
    setSelectedQuestion(null);
    setIsFormOpen(false);
    refetch();
  };

  const handleBulkSuccess = () => {
    setIsBulkOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {canModify && (
          <div className="flex gap-2">
            <Button onClick={handleOpenAdd}>
              {t("questionBank.questionList.addQuestion")}
            </Button>
            <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
              {t("questionBank.questionList.bulkUpload")}
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Select
            value={difficulty}
            onValueChange={(val) => {
              setDifficulty(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("questionBank.questionForm.selectDifficultyPlaceholder", "All Difficulties")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all", "All") || "All"}</SelectItem>
              <SelectItem value="remember">{t("questionBank.questionForm.remember")}</SelectItem>
              <SelectItem value="understand">{t("questionBank.questionForm.understand")}</SelectItem>
              <SelectItem value="apply">{t("questionBank.questionForm.apply")}</SelectItem>
              <SelectItem value="analyze">{t("questionBank.questionForm.analyze")}</SelectItem>
              <SelectItem value="evaluate">{t("questionBank.questionForm.evaluate")}</SelectItem>
              <SelectItem value="create">{t("questionBank.questionForm.create")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("questionBank.questionList.uid")}</TableHead>
            <TableHead>{t("questionBank.questionList.question")}</TableHead>
            <TableHead>{t("questionBank.questionList.difficulty")}</TableHead>
            <TableHead>{t("questionBank.questionList.marks")}</TableHead>
            <TableHead
              className="cursor-pointer hover:text-primary transition-colors select-none"
              onClick={() => {
                if (sortBy === "createdAt") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("createdAt");
                  setSortOrder("desc");
                }
              }}
            >
              <div className="flex items-center gap-1">
                Created At
                {sortBy === "createdAt" && (
                  <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead>{t("questionBank.questionList.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={6} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("questionBank.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : questions?.length > 0 ? (
            questions?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i?.uid}</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {i?.question_text || "-"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.difficulty || "understand"} />
                </TableCell>
                <TableCell>{i?.marks ?? 1}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {i?.createdAt ? moment(i.createdAt).format("DD-MM-YYYY") : "-"}
                </TableCell>
                <TableCell>
                  {canModify && (
                    <RowActionMenu
                      actions={[
                        {
                          label: t("questionBank.questionList.edit"),
                          icon: Edit,
                          onClick: () => handleOpenEdit(i),
                        },
                        {
                          label: t("questionBank.questionList.delete"),
                          icon: Trash2,
                          onClick: () => handleDeleteClick(i),
                        },
                      ]}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {t("questionBank.questionList.noQuestions")}
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

      <QuestionForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        questionBankId={questionBankId}
        questionData={selectedQuestion}
        onSuccess={handleFormSuccess}
      />

      <BulkUploadDialog
        open={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        questionBankId={questionBankId}
        onSuccess={handleBulkSuccess}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data={t("questionBank.question")}
      />
    </div>
  );
};

export default QuestionList;
