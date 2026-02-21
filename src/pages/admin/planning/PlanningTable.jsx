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
import { useState, useEffect } from "react";
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
import { useGetAllCities } from "@/store/useDropdownStore";
import moment from "moment";

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
  const [activeCity, setActiveCity] = useState(() => {
    return localStorage.getItem("planningActiveCity") || "all";
  });

  const debouncedSearch = useDebounce(search, 500);

  // Fetch all cities for tabs
  const { data: citiesData, isLoading: citiesLoading } = useGetAllCities({});
  const cities = citiesData?.data || [];

  // Update localStorage when active city changes
  useEffect(() => {
    localStorage.setItem("planningActiveCity", activeCity);
  }, [activeCity]);

  // Reset page when city or search changes
  useEffect(() => {
    setPage(1);
  }, [activeCity, debouncedSearch]);

  const { data, isLoading, isFetching, error, refetch } = useGetPlanning({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(activeCity !== "all" ? { city: activeCity } : {}),
  });
  const { mutateAsync: deletePlanning, isPending: isDeleting } =
    useDeletePlanning();

  const plannings = data?.data || [];
  const totalRows = data?.total_count || 0;

  // Helper function to get session date range
  const getSessionDateRange = (sessions) => {
    if (!sessions || sessions.length === 0) return "N/A";
    
    const dates = sessions
      .map(session => session.session_date)
      .filter(date => date)
      .map(date => moment(date))
      .sort((a, b) => a - b);
    
    if (dates.length === 0) return "N/A";
    
    if (dates.length === 1) {
      return dates[0].format('MMM D, YYYY');
    }
    
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    // If same month and year, show: "Mar 13-14, 2026"
    if (firstDate.isSame(lastDate, 'month') && firstDate.isSame(lastDate, 'year')) {
      return `${firstDate.format('MMM D')}-${lastDate.format('D, YYYY')}`;
    }
    
    // If same year but different months, show: "Nov 27 - Dec 14, 2025"
    if (firstDate.isSame(lastDate, 'year')) {
      return `${firstDate.format('MMM D')} - ${lastDate.format('MMM D, YYYY')}`;
    }
    
    // Different years, show full dates: "Dec 27, 2025 - Jan 14, 2026"
    return `${firstDate.format('MMM D, YYYY')} - ${lastDate.format('MMM D, YYYY')}`;
  };

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
      {/* City Tabs */}
      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveCity("all")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeCity === "all"
                ? "border-[#ff8904] text-[#ff8904]"
                : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
            }`}
          >
           All Cities
          </button>
          {citiesLoading ? (
            <div className="py-2 px-1 text-sm text-gray-400">
              {t("common.loading") || "Loading..."}
            </div>
          ) : (
            cities.map((city) => (
              <button
                key={city._id}
                onClick={() => setActiveCity(city._id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeCity === city._id
                    ? "border-[#ff8904] text-[#ff8904]"
                    : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
                }`}
              >
                {city.name}
              </button>
            ))
          )}
        </nav>
      </div>

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
            <TableHead>Year</TableHead>
            <TableHead>Session Dates</TableHead>
            <TableHead>{t("planningManagement.table.venue")}</TableHead>
            <TableHead>{t("planningManagement.table.teachers")}</TableHead>
            <TableHead>{t("planningManagement.table.status")}</TableHead>
            <TableHead>{t("planningManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={9} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center p-8">
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
                  {i?.cohort_year || "N/A"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {getSessionDateRange(i?.sessions)}
                </TableCell>
                <TableCell
                  className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={i?.venue}
                >
                  {i?.venue || "N/A"}
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
              <TableCell colSpan={9} className="text-center">
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
        activeCity={activeCity}
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
