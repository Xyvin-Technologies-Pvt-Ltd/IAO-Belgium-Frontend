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
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useDeletePlanning, useGetPlanning } from "@/store/usePlanningStore";
import CreatePlanning from "@/components/admin/planning/CreatePlanning";
import ViewPlanning from "@/components/admin/planning/ViewPlanning";
import StatusBadge from "@/components/StatusBadge";

const PlanningTable = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState(null);
  const [viewPlanning, setViewPlanning] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isFetching, error, refetch } = useGetPlanning({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const { mutateAsync: deletePlanning, isPending: isDeleting } =
    useDeletePlanning();

  const plannings = data?.data || [];
  const totalRows = data?.total_count || 0;

  // Helper function to get unique teachers from all sessions
  const getUniqueTeachers = (sessions) => {
    if (!sessions || sessions.length === 0) return [];
    
    const teacherMap = new Map();
    
    sessions.forEach(session => {
      // Add teachers
      if (session.teachers && session.teachers.length > 0) {
        session.teachers.forEach(teacherObj => {
          const teacher = teacherObj.teacher;
          if (teacher && teacher._id) {
            teacherMap.set(teacher._id, {
              _id: teacher._id,
              name: `${teacher.first_name} ${teacher.last_name}`.trim()
            });
          }
        });
      }
      
      // Add assistants
      if (session.assistants && session.assistants.length > 0) {
        session.assistants.forEach(assistantObj => {
          const assistant = assistantObj.assistant;
          if (assistant && assistant._id) {
            teacherMap.set(assistant._id, {
              _id: assistant._id,
              name: `${assistant.first_name} ${assistant.last_name}`.trim()
            });
          }
        });
      }
      
      // Add trainees
      if (session.trainees && session.trainees.length > 0) {
        session.trainees.forEach(traineeObj => {
          const trainee = traineeObj.trainee;
          if (trainee && trainee._id) {
            teacherMap.set(trainee._id, {
              _id: trainee._id,
              name: `${trainee.first_name} ${trainee.last_name}`.trim()
            });
          }
        });
      }
    });
    
    return Array.from(teacherMap.values());
  };

  // Helper function to render teacher chips
  const renderTeacherChips = (sessions) => {
    const teachers = getUniqueTeachers(sessions);
    
    if (teachers.length === 0) {
      return <span className="text-gray-500 text-sm">No teachers assigned</span>;
    }
    
    if (teachers.length === 1) {
      return (
        <Badge variant="secondary" className="text-xs">
          {teachers[0].name}
        </Badge>
      );
    }
    
    if (teachers.length === 2) {
      return (
        <div className="flex flex-wrap gap-1">
          {teachers.map(teacher => (
            <Badge key={teacher._id} variant="secondary" className="text-xs">
              {teacher.name}
            </Badge>
          ))}
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-xs">
          {teachers[0].name}
        </Badge>
        <Badge variant="outline" className="text-xs">
          +{teachers.length - 1} more
        </Badge>
      </div>
    );
  };

  const handleOpenCreate = () => {
    setSelectedPlanning(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlanning(plan);
    setIsModalOpen(true);
  };

  const handleOpenView = (plan) => {
    setViewPlanning(plan);
    setIsViewModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deletePlanning(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("planningManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate}>
          {t("planningManagement.createPlanning")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("planningManagement.table.program")}</TableHead>
            <TableHead>{t("planningManagement.table.batch")}</TableHead>
            <TableHead>{t("planningManagement.table.module")}</TableHead>
            <TableHead>{t("planningManagement.table.teachers")}</TableHead>
            <TableHead>{t("planningManagement.table.status")}</TableHead>
            <TableHead>{t("planningManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("planningManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : plannings?.length > 0 ? (
            plannings?.map((i) => (
              <TableRow 
                key={i._id} 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleOpenView(i)}
              >
                <TableCell>{i?.component?.program?.name}</TableCell>
                <TableCell
                  className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={i?.batch?.name}
                >
                  {i?.batch?.name}
                </TableCell>
                <TableCell
                  className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={i?.component?.name}
                >
                  {i?.component?.name}
                </TableCell>
                <TableCell>
                  {renderTeacherChips(i?.sessions)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("planningManagement.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                      {
                        label: t("planningManagement.delete"),
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
              <TableCell colSpan={6} className="text-center">
                {t("planningManagement.table.noPlannings")}
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

      <CreatePlanning
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planningData={selectedPlanning}
      />

      <ViewPlanning
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        planningData={viewPlanning}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeleting}
        data="Planning"
      />
    </div>
  );
};

export default PlanningTable;
