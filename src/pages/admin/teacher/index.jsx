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
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import CreateTeacher from "@/components/admin/teacher/CreateTeacher";
import { useDeleteTeacher, useGetTeachers } from "@/store/useTeacherStore";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";
import { useNavigate } from "@tanstack/react-router";
import TeacherFilterDrawer, {
  MULTI_FILTER_KEYS,
  createEmptyFilters,
} from "./TeacherFilterDrawer";

const Teachers = () => {
  const { t } = useTranslation();
  const navigate=useNavigate()
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Filter States
  const [appliedFilters, setAppliedFilters] = useState(createEmptyFilters());
  const [draftFilters, setDraftFilters] = useState(createEmptyFilters());

  const debouncedSearch = useDebounce(search, 500);
   useEffect(() => {
     setPage(1);
   }, [debouncedSearch]);

  // Multi-select filters are sent as comma-joined id lists; the backend expands them into $in
  const multiFilterParams = MULTI_FILTER_KEYS.reduce((acc, key) => {
    const ids = (appliedFilters[key] || []).map((item) => item._id);
    if (ids.length) acc[key] = ids.join(",");
    return acc;
  }, {});

  const { data, isLoading, error, refetch, isFetching } = useGetTeachers({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...multiFilterParams,
    ...(appliedFilters.location !== "all" && { location: appliedFilters.location }),
    ...(appliedFilters.status !== "all" && { status: appliedFilters.status }),
  });
  const { mutateAsync: deleteTeacher, isPending: isDeleting } =
    useDeleteTeacher();

  const teacher = data?.data || [];
  const totalRows = data?.total_count || 0;
  const handleOpenCreate = () => {
    setSelectedTeacher(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTeacher(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };
  const handleRowClick = (id) => {
    navigate({
      to: "/admin/teacher-management/$id",
      params: { id: id },
    });
  };
  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("teacherManagement.title")}
      </h2>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder={t("teacherManagement.search")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <TeacherFilterDrawer
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            setPage={setPage}
          />
        </div>
        <Button onClick={handleOpenCreate}>
          {t("teacherManagement.createTeacher")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("teacherManagement.table.teacherId")}</TableHead>
            <TableHead>{t("teacherManagement.table.name")}</TableHead>
            <TableHead>{t("teacherManagement.table.email")}</TableHead>
            <TableHead>{t("teacherManagement.table.phone")}</TableHead>
            <TableHead>{t("teacherManagement.table.academicDegree")}</TableHead>
            <TableHead>{t("teacherManagement.table.role")}</TableHead>
            <TableHead>{t("teacherManagement.modal.contractTypeLabel", "Contract Type")}</TableHead>
            <TableHead>{t("teacherManagement.modal.departmentLabel", "Department")}</TableHead>
            <TableHead>{t("teacherManagement.modal.regionLabel", "Region")}</TableHead>
            <TableHead>{t("teacherManagement.modal.teachingRegionsLabel", "Regions Where They Teach")}</TableHead>
            <TableHead>{t("teacherManagement.table.employmentStartDate")}</TableHead>
            <TableHead>{t("teacherManagement.table.location")}</TableHead>
            <TableHead>{t("teacherManagement.table.language")}</TableHead>
            <TableHead>{t("teacherManagement.modal.motherTongueLabel", "Mother Tongue")}</TableHead>
            <TableHead>{t("teacherManagement.table.status")}</TableHead>
            <TableHead>{t("teacherManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
       <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={16} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={16} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("teacherManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : teacher?.length > 0 ? (
            teacher?.map((i) => (
              <TableRow key={i._id}  className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}>
                <TableCell>{i?.uid}</TableCell>
                <TableCell className={"capitalize"}>{i?.last_name + " " + i?.first_name}</TableCell>
                <TableCell>{i?.email}</TableCell>
                <TableCell>{i?.phone}</TableCell>
                <TableCell>
                  {Array.isArray(i?.academic_degree)
                    ? i.academic_degree.map((d) => d?.name).filter(Boolean).join(", ") || "-"
                    : i?.academic_degree?.name || "-"}
                </TableCell>
                <TableCell>{i?.teacher_role?.name || "-"}</TableCell>
                <TableCell>{i?.contract_type?.name || "-"}</TableCell>
                <TableCell>
                  {Array.isArray(i?.department) && i.department.length > 0
                    ? i.department.map((d) => d?.name).filter(Boolean).join(", ")
                    : i?.department?.name || "-"}
                </TableCell>
                <TableCell>
                  {Array.isArray(i?.region) && i.region.length > 0
                    ? i.region.map((r) => r?.name).filter(Boolean).join(", ")
                    : i?.region?.name || "-"}
                </TableCell>
                <TableCell>
                  {Array.isArray(i?.teaching_regions) && i.teaching_regions.length > 0
                    ? i.teaching_regions.map((tr) => tr?.name).filter(Boolean).join(", ")
                    : i?.teaching_regions?.name || "-"}
                </TableCell>
                <TableCell>
                  {moment(i?.iao_employment_start_date).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell>
                  {i?.location?.length
                    ? i.location.map((loc) => loc.name).join(", ")
                    : "-"}
                </TableCell>

                <TableCell>
                  {i?.language?.length
                    ? i.language.map((lang) => lang.name).join(", ")
                    : "-"}
                </TableCell>
                <TableCell>{i?.mother_tongue?.name || "-"}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("teacherManagement.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                      {
                        label: t("teacherManagement.delete"),
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
              <TableCell colSpan={16} className="text-center">
                {t("teacherManagement.table.noTeachers")}
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

      <CreateTeacher
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teacherData={selectedTeacher}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data="Teacher"
      />
    </div>
  );
};

export default Teachers;
