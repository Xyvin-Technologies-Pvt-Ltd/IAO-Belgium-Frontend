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
import { useNavigate } from "@tanstack/react-router";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useDeleteIntake, useGetIntakes } from "@/store/useIntakeStore";
import CreateIntake from "@/components/admin/intake/CreateIntake";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";

const Intakes = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetIntakes({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deleteIntake, isPending: isDeleting } =
    useDeleteIntake();

  const intakes = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (intakeId) => {
    navigate({ 
      to: "/admin/admission-administration/intakes/$id", 
      params: { id: intakeId } 
    });
  };

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

  return (
    <div className="space-y-6 mt-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
       {t("intakeManagement.title")}
      </h2>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("intakeManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate}>
          {t("intakeManagement.createIntake")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("intakeManagement.table.name")}</TableHead>
            <TableHead>{t("intakeManagement.table.program")}</TableHead>
            <TableHead>{t("intakeManagement.table.admissionFee")}</TableHead>
            <TableHead>{t("intakeManagement.table.startDate")}</TableHead>
            <TableHead>{t("intakeManagement.table.endDate")}</TableHead>
            <TableHead>{t("intakeManagement.table.registrationDeadline")}</TableHead>
            <TableHead>{t("intakeManagement.table.status")}</TableHead>
            <TableHead>{t("intakeManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={8} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message ||
                    t("intakeManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : intakes?.length > 0 ? (
            intakes?.map((i) => (
              <TableRow 
                key={i._id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.program?.name || "N/A"}</TableCell>
                <TableCell>${i?.admission_fee || 0}</TableCell>
                <TableCell>
                  {i?.start_date
                    ? moment(i.start_date).format("MMM DD, YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {i?.end_date
                    ? moment(i.end_date).format("MMM DD, YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {i?.registration_deadline
                    ? moment(i.registration_deadline).format("MMM DD, YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("intakeManagement.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                      {
                        label: t("intakeManagement.delete"),
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
                {t("intakeManagement.table.noIntakes")}
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
      <CreateIntake
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        intakeData={selectedIntake}
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
