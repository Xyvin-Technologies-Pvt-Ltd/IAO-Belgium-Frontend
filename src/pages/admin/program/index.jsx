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
import { Edit, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import CreateCountry from "@/components/admin/location/CreateCountry";
import {
  useDeleteProgram,
  useGetPrograms,
  useUpdateProgram,
  useDuplicateProgram,
} from "@/store/useProgramStore";
import CreateProgram from "@/components/admin/programs/CreateProgram";

const Programs = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetPrograms({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteProgram, isPending: isDeleting } =
    useDeleteProgram();
  const { mutate: updateProgram } = useUpdateProgram();
  const { mutate: duplicateProgram } = useDuplicateProgram();

  const programs = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedProgram(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (program) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProgram(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const handleStatusToggle = (id, currentStatus) => {
    updateProgram({ id, data: { status: !currentStatus } });
  };

  const handleDuplicate = (id) => {
    duplicateProgram(id);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("programManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate}>
          {t("programManagement.createProgram")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("programManagement.table.uid")}</TableHead>
            <TableHead>{t("programManagement.table.name")}</TableHead>
            <TableHead>{t("programManagement.table.description")}</TableHead>
            <TableHead>{t("programManagement.table.type")}</TableHead>
            <TableHead>{t("programManagement.table.year")}</TableHead>
            <TableHead>{t("programManagement.table.city")}</TableHead>
            <TableHead>{t("programManagement.table.language")}</TableHead>
            <TableHead>{t("programManagement.table.status")}</TableHead>
            <TableHead>{t("programManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={9} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("programManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : programs?.length > 0 ? (
            programs?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i?.uid}</TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell
                  title={i?.description}
                  className="max-w-38 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {i?.description}
                </TableCell>
                <TableCell>{i?.program_type}</TableCell>
                <TableCell>{i?.year}</TableCell>
                <TableCell>{i?.city?.name}</TableCell>
                <TableCell>{i?.language?.name}</TableCell>
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
                        label: t("programManagement.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                      {
                        label: t("programManagement.duplicate"),
                        icon: Copy,
                        onClick: () => handleDuplicate(i._id),
                      },
                      {
                        label: t("programManagement.delete"),
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
              <TableCell colSpan={9} className="text-center">
                {t("programManagement.table.noPrograms")}
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

      <CreateProgram
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        programData={selectedProgram}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data="Program"
      />
    </div>
  );
};

export default Programs;
