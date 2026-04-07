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
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
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
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import IntakesFilterDrawer from "./IntakesFilterDrawer";


const DEFAULT_FILTERS = { status: "all", city: "all", language: "all", country: "all" };

const Intakes = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const id = params.id;
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const { updateBreadcrumbs } = useBreadcrumb();
  const debouncedSearch = useDebounce(search, 500);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  const { data, isLoading, error, refetch, isFetching } = useGetIntakes(id, {
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(appliedFilters.status !== "all" ? { status: appliedFilters.status } : {}),
    ...(appliedFilters.city !== "all" ? { city: appliedFilters.city } : {}),
    ...(appliedFilters.language !== "all" ? { language: appliedFilters.language } : {}),
  });
  const { mutateAsync: deleteIntake, isPending: isDeleting } =
    useDeleteIntake();

  const intakes = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (intakeId) => {
    navigate({
      to: "/admin/admission-administration/academics/intakes/$id",
      params: { id: intakeId },
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
  useEffect(() => {
    if (intakes) {
      updateBreadcrumbs([
        {
          label: t("common.admissionAdministration"),
          path: "/admin/admission-administration",
          navigable: false,
        },
        {
          label: t("common.academics"),
          path: "/admin/admission-administration/academics",
          navigable: true,
        },
        {
          label: t("common.intakes"),
          path: `/admin/admission-administration/intakes/batch/${intakes._id}`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [intakes?.data?._id]);
  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("intakeManagement.title")}
        </h2>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("intakeManagement.search")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <IntakesFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
          />
        </div>
        <Button onClick={handleOpenCreate}>
          {t("intakeManagement.createIntake")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("intakeManagement.table.name")}</TableHead>
            <TableHead>{t("intakeManagement.table.program")}</TableHead>
            <TableHead>{t("intakeManagement.table.city")}</TableHead>
            <TableHead>{t("intakeManagement.table.language")}</TableHead>
            <TableHead>{t("intakeManagement.table.registrationFee")}</TableHead>
            <TableHead>{t("intakeManagement.table.startDate")}</TableHead>
            <TableHead>{t("intakeManagement.table.endDate")}</TableHead>
            <TableHead>
              {t("intakeManagement.table.registrationDeadline")}
            </TableHead>
            <TableHead>{t("intakeManagement.table.status")}</TableHead>
            <TableHead>{t("intakeManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={10} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("intakeManagement.messages.loadFailed")
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
                <TableCell>{i?.program?.city?.name || "N/A"}</TableCell>
                <TableCell>{i?.program?.language?.name || "N/A"}</TableCell>
                <TableCell>{i?.admission_fee || 0}</TableCell>
                <TableCell>
                  {i?.start_date
                    ? moment.utc(i.start_date).format("MMM DD, YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {i?.end_date
                    ? moment.utc(i.end_date).format("MMM DD, YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {i?.registration_deadline
                    ? moment.utc(i.registration_deadline).format("MMM DD, YYYY")
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
              <TableCell colSpan={10} className="text-center">
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
        academicId={id}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data={t("common.intake")}
      />
    </div>
  );
};

export default Intakes;
