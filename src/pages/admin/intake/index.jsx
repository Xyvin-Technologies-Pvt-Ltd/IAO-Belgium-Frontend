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
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import {
  useDeleteIntake,
  useGetIntakes,
  useUpdateIntake,
} from "@/store/useIntakeStore";

const Intakes = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetIntakes({
    page_no: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteIntake, isPending: isDeleting } =
    useDeleteIntake();
  const { mutate: updateIntake } = useUpdateIntake();

  const intakes = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedIntake(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (intake) => {
    setSelectedIntake(intake);
    setIsModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteIntake(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const handleStatusToggle = (id, currentStatus) => {
    updateIntake({ id, data: { status: !currentStatus } });
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("languageManagement.search")}
          className="max-w-xs"
          value={search}
          whiteBg
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate}>
          {t("languageManagement.createLanguage")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("languageManagement.table.name")}</TableHead>
            <TableHead>{t("languageManagement.table.status")}</TableHead>
            <TableHead>{t("languageManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={3} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message ||
                    t("languageManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : intakes?.length > 0 ? (
            intakes?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i?.name}</TableCell>
                <TableCell>
                  <Switch
                    checked={i?.status}
                    onCheckedChange={(checked) => {
                      handleStatusToggle(i._id, i?.status);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("languageManagement.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                      {
                        label: t("languageManagement.delete"),
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
              <TableCell colSpan={3} className="text-center">
                {t("languageManagement.table.noLanguages")}
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

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data="Intake"
      />
    </div>
  );
};

export default Intakes;
