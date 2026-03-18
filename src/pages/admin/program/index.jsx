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
import { useNavigate } from "@tanstack/react-router";
import ProgramsFilterDrawer from "./ProgramsFilterDrawer";

const Programs = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState({
    program_type: "all",
    language: "all",
    city: "all",
    country: "all",
    status: "all",
  });
  const [draftFilters, setDraftFilters] = useState({
    program_type: "all",
    language: "all",
    city: "all",
    country: "all",
    status: "all",
  });

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetPrograms({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(appliedFilters.program_type !== "all"
      ? { program_type: appliedFilters.program_type }
      : {}),
    ...(appliedFilters.language !== "all"
      ? { language: appliedFilters.language }
      : {}),
    ...(appliedFilters.city !== "all" ? { city: appliedFilters.city } : {}),
    ...(appliedFilters.status !== "all"
      ? { status: appliedFilters.status }
      : {}),
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
  const handleRowClick = (id) => {
    navigate({
      to: "/admin/program/$id",
      params: { id: id },
    });
  };
  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("programManagement.title")}
      </h2>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder={t("programManagement.search")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ProgramsFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
          />
        </div>
        <Button onClick={handleOpenCreate}>
          {t("programManagement.createProgram")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("programManagement.table.uid")}</TableHead>
            <TableHead>{t("programManagement.table.name")}</TableHead>

            <TableHead>{t("programManagement.table.type")}</TableHead>
            <TableHead>{t("programManagement.table.year")}</TableHead>
            <TableHead>{t("programManagement.table.city")}</TableHead>
            <TableHead>{t("programManagement.table.language")}</TableHead>
            <TableHead>{t("programManagement.table.status")}</TableHead>
            <TableHead>{t("programManagement.table.action")}</TableHead>
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
                    error?.message || t("programManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : programs?.length > 0 ? (
            programs?.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell>{i?.name}</TableCell>

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
              <TableCell colSpan={8} className="text-center">
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
