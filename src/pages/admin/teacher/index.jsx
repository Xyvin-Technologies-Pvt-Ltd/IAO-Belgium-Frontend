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
import CreateTeacher from "@/components/admin/teacher/CreateTeacher";
import { useDeleteTeacher, useGetTeachers } from "@/store/useTeacherStore";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";
import { useNavigate } from "@tanstack/react-router";

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

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch,isFetching } = useGetTeachers({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
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
        <Input
          placeholder={t("teacherManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
            <TableHead>{t("teacherManagement.table.employmentStartDate")}</TableHead>
            <TableHead>{t("teacherManagement.table.location")}</TableHead>
            <TableHead>{t("teacherManagement.table.language")}</TableHead>
            <TableHead>{t("teacherManagement.table.status")}</TableHead>
            <TableHead>{t("teacherManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
       <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={11} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center p-8">
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
                <TableCell>{i?.first_name + " " + i?.last_name}</TableCell>
                <TableCell>{i?.email}</TableCell>
                <TableCell>{i?.phone}</TableCell>
                <TableCell>{i?.academic_degree?.name}</TableCell>
                <TableCell>{i?.teacher_role?.name}</TableCell>
                <TableCell>
                  {moment(i?.iao_employment_start_date).format("YYYY-MM-DD")}
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
              <TableCell colSpan={11} className="text-center">
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
