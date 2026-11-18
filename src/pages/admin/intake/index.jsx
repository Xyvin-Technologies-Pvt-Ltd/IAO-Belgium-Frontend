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
import { Edit, Trash2, Download, X } from "lucide-react";
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
import { useCanModify } from "@/hooks/useCanModify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportIntakes } from "@/api/intakeApi";
import { toast } from "sonner";
import {
  DEFAULT_INTAKE_FILTERS,
  buildIntakeQueryFilters,
  countActiveIntakeFilters,
  loadStoredIntakeFilters,
  loadStoredIntakeSearch,
  saveStoredIntakeFilters,
  saveStoredIntakeSearch,
} from "./intakeFilterUtils";

const EXPORT_MIME = {
  csv: "text/csv;charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const Intakes = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("operations");
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const id = params.id;
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  //* IPB-152: filters + search survive opening an intake and coming back
  const [search, setSearch] = useState(() => loadStoredIntakeSearch(id));
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [draftFilters, setDraftFilters] = useState(() => loadStoredIntakeFilters(id));
  const [appliedFilters, setAppliedFilters] = useState(() => loadStoredIntakeFilters(id));
  const [exportPending, setExportPending] = useState(false);
  const { updateBreadcrumbs } = useBreadcrumb();
  const debouncedSearch = useDebounce(search, 500);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (id) saveStoredIntakeFilters(id, appliedFilters);
  }, [id, appliedFilters]);

  useEffect(() => {
    if (id) saveStoredIntakeSearch(id, search);
  }, [id, search]);

  const queryFilters = buildIntakeQueryFilters(appliedFilters, {
    search: debouncedSearch,
  });
  const hasActiveFilters = countActiveIntakeFilters(appliedFilters) > 0 || Boolean(search);

  const { data, isLoading, error, refetch, isFetching } = useGetIntakes(id, {
    page: page,
    limit: rowsPerPage,
    ...queryFilters,
  });

  const handleClearFilters = () => {
    setDraftFilters({ ...DEFAULT_INTAKE_FILTERS });
    setAppliedFilters({ ...DEFAULT_INTAKE_FILTERS });
    setSearch("");
    setPage(1);
  };

  const handleExport = async (format) => {
    try {
      setExportPending(true);
      const fileData = await exportIntakes(id, queryFilters, format);
      const blob = new Blob([fileData], { type: EXPORT_MIME[format] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `intakes_${moment().format("YYYY-MM-DD")}.${format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err?.message || t("intakeManagement.messages.exportFailed"));
    } finally {
      setExportPending(false);
    }
  };
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
        <div className="flex items-center gap-2 flex-1">
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
          {hasActiveFilters && (
            <Button variant="ghost" className="gap-1" onClick={handleClearFilters}>
              <X className="h-4 w-4" />
              {t("intakeManagement.filters.clearFilters")}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={exportPending}>
                <Download className="h-4 w-4" />
                {exportPending
                  ? t("intakeManagement.export.exporting")
                  : t("intakeManagement.export.title")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                {t("intakeManagement.export.csv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                {t("intakeManagement.export.excel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canModify && (
            <Button onClick={handleOpenCreate}>
              {t("intakeManagement.createIntake")}
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("intakeManagement.table.name")}</TableHead>
            <TableHead>{t("intakeManagement.table.city")}</TableHead>
            <TableHead>{t("intakeManagement.table.language")}</TableHead>
            <TableHead>{t("intakeManagement.table.enrolled")}</TableHead>
            <TableHead>{t("intakeManagement.table.capacity")}</TableHead>
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
            <TableSkeleton rows={rowsPerPage} columns={11} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center p-8">
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
                {/* IPB-152: Programme column hidden — the intake name already contains it */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{i?.name}</span>
                    {i?.program?.is_online && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded bg-[#ff8904]/10 text-[#ff8904] border border-[#ff8904]/20">
                        {t("common.online", "Online")}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{i?.program?.city?.name || "N/A"}</TableCell>
                <TableCell>{i?.program?.language?.name || "N/A"}</TableCell>
                <TableCell>{i?.enrolled_count ?? 0}</TableCell>
                <TableCell>{i?.max_student_enrollment ?? 0}</TableCell>
                <TableCell>{i?.admission_fee || 0}</TableCell>
                <TableCell>
                  {i?.start_date
                    ? moment.utc(i.start_date).format("DD-MM-YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {i?.end_date
                    ? moment.utc(i.end_date).format("DD-MM-YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {i?.registration_deadline
                    ? moment.utc(i.registration_deadline).format("DD-MM-YYYY")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canModify && (
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
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
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
