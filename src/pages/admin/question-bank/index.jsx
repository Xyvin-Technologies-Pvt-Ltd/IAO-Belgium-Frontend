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
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import CreateQuestionBank from "@/components/admin/question-bank/CreateQuestionBank";
import {
  useGetQuestionBanks,
  useUpdateQuestionBank,
  useDeleteQuestionBank,
} from "@/store/useQuestionBankStore";
import { useNavigate } from "@tanstack/react-router";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";

const QuestionBanks = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetQuestionBanks({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    sort_by: sortBy,
    sort_order: sortOrder,
  });
  const { mutateAsync: deleteBank, isPending: isDeleting } =
    useDeleteQuestionBank();
  const { mutate: updateBank } = useUpdateQuestionBank();

  const banks = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedBank(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bank) => {
    setSelectedBank(bank);
    setIsModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteBank(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const handleRowClick = (id) => {
    navigate({
      to: "/admin/examination/question-banks/$id",
      params: { id },
    });
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("questionBank.title")}
      </h2>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("questionBank.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate}>
          {t("questionBank.createQuestionBank")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("questionBank.table.uid")}</TableHead>
            <TableHead>{t("questionBank.table.name")}</TableHead>
            <TableHead>{t("questionBank.table.description")}</TableHead>
            <TableHead>{t("questionBank.table.questionCount")}</TableHead>
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
            <TableHead>{t("questionBank.table.status")}</TableHead>
            <TableHead>{t("questionBank.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={7} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("questionBank.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : banks?.length > 0 ? (
            banks?.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {i?.description || "-"}
                </TableCell>
                <TableCell>{i?.question_count ?? 0}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {i?.createdAt ? moment(i.createdAt).format("DD-MM-YYYY") : "-"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("questionBank.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                      {
                        label: t("questionBank.table.delete"),
                        icon: Trash2,
                        onClick: () => handleRowDeleteClick(i._id),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                {t("questionBank.table.noQuestionBanks")}
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

      <CreateQuestionBank
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bankData={selectedBank}
        onSuccess={() => {
          setSelectedBank(null);
          setIsModalOpen(false);
          refetch();
        }}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data="Question Bank"
      />
    </div>
  );
};

export default QuestionBanks;
