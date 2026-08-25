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
import { Edit, Trash2, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import PlanningFilterDrawer, { DEFAULT_FILTERS } from "./PlanningFilterDrawer";
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
import { getMoment } from "@/utils/dateUtils";
import { useCanModify } from "@/hooks/useCanModify";

const PLANNING_FILTERS_KEY = "planning_filters";
const PLANNING_SEARCH_KEY = "planning_search";

const loadSavedFilters = () => {
  try {
    const saved = sessionStorage.getItem(PLANNING_FILTERS_KEY);
    if (saved) {
      return { ...DEFAULT_FILTERS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore invalid session data
  }
  return { ...DEFAULT_FILTERS };
};

const PlanningTable = ({ activeCity }) => {
  const { t } = useTranslation();
  const canModify = useCanModify("operations");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState(() => {
    return sessionStorage.getItem(PLANNING_SEARCH_KEY) || "";
  });
  const [draftFilters, setDraftFilters] = useState(loadSavedFilters);
  const [appliedFilters, setAppliedFilters] = useState(loadSavedFilters);
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState(null);
  const [viewPlanning, setViewPlanning] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const prevCityRef = useRef(activeCity);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [activeCity, debouncedSearch, appliedFilters]);

  useEffect(() => {
    sessionStorage.setItem(PLANNING_FILTERS_KEY, JSON.stringify(appliedFilters));
  }, [appliedFilters]);

  useEffect(() => {
    sessionStorage.setItem(PLANNING_SEARCH_KEY, search);
  }, [search]);

  useEffect(() => {
    if (prevCityRef.current === activeCity) return;
    prevCityRef.current = activeCity;
    setDraftFilters((prev) => ({
      ...prev,
      program: "all",
      batch: "all",
      module_number: "all",
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      program: "all",
      batch: "all",
      module_number: "all",
    }));
  }, [activeCity]);

  const { data, isLoading, isFetching, error, refetch } = useGetPlanning({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(activeCity !== "all" ? { city: activeCity } : {}),
    ...(appliedFilters.module_number !== "all" ? { module_number: appliedFilters.module_number } : {}),
    ...(appliedFilters.program !== "all" ? { program: appliedFilters.program } : {}),
    ...(appliedFilters.batch !== "all" ? { batch: appliedFilters.batch } : {}),
    ...(appliedFilters.academic !== "all" ? { academic: appliedFilters.academic } : {}),
    ...(appliedFilters.status !== "all" ? { status: appliedFilters.status } : {}),
  });
  const { mutateAsync: deletePlanning, isPending: isDeleting } =
    useDeletePlanning();

  const plannings = data?.data || [];
  const totalRows = data?.total_count || 0;

  // Helper function to get session start and end dates
  const getSessionStartDate = (sessions) => {
    if (!sessions || sessions.length === 0) return "N/A";

    const dates = sessions
      .map((session) => session.session_date)
      .filter((date) => date)
      .map((date) => getMoment(date))
      .sort((a, b) => a - b);

    if (dates.length === 0) return "N/A";

    return dates[0].format("DD-MM-YYYY");
  };

  const getSessionEndDate = (sessions) => {
    if (!sessions || sessions.length === 0) return "N/A";

    const dates = sessions
      .map((session) => session.session_date)
      .filter((date) => date)
      .map((date) => getMoment(date))
      .sort((a, b) => a - b);

    if (dates.length === 0) return "N/A";

    return dates[dates.length - 1].format("DD-MM-YYYY");
  };

  // Helper function to get unique personnel across all sessions
  const getPersonnelFromFirstSession = (sessions, role) => {
    if (!sessions || sessions.length === 0) return [];

    const roleSingular = role.slice(0, -1); // 'teachers' -> 'teacher'
    const seen = new Map();

    sessions.forEach((session) => {
      if (!session[role]) return;
      session[role].forEach((item) => {
        const person = item[roleSingular];
        if (person && person._id && !seen.has(person._id)) {
          seen.set(person._id, {
            _id: person._id,
            name: `${person.last_name || ""} ${person.first_name || ""}`.trim(),
            status: item.status || "pending",
          });
        }
      });
    });

    return Array.from(seen.values());
  };

  // Helper function to render personnel chips with status colors
  const renderPersonnelChips = (sessions, role) => {
    const personnel = getPersonnelFromFirstSession(sessions, role);

    if (personnel.length === 0) {
      return (
        <span className="text-gray-500 text-sm">
          {role === 'teachers' ? 'No teachers' : role === 'assistants' ? 'No assistants' : 'No trainees'}
        </span>
      );
    }

    const getBadgeColor = (status) => {
      switch (status?.toLowerCase()) {
        case "accepted":
          return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
        case "rejected":
          return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
        case "pending":
        default:
          return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      }
    };

    if (personnel.length === 1) {
      return (
        <Badge variant="outline" className={`text-xs whitespace-nowrap ${getBadgeColor(personnel[0].status)}`}>
          {personnel[0].name}
        </Badge>
      );
    }

    if (personnel.length === 2) {
      return (
        <div className="flex flex-wrap gap-1">
          {personnel.map((p) => (
            <Badge key={p._id} variant="outline" className={`text-xs whitespace-nowrap ${getBadgeColor(p.status)}`}>
              {p.name}
            </Badge>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className={`text-xs whitespace-nowrap ${getBadgeColor(personnel[0].status)}`}>
          {personnel[0].name}
        </Badge>
        <Badge variant="secondary" className="text-xs px-1 whitespace-nowrap">
          +{personnel.length - 1}
        </Badge>
      </div>
    );
  };

  const renderExamChips = (exams, practicalExams) => {
    const allExams = [
      ...(exams || []).map(ex => ({ ...ex, isPractical: false })),
      ...(practicalExams || []).map(ex => ({ ...ex, isPractical: true })),
    ];

    if (allExams.length === 0) {
      return (
        <span className="text-gray-500 text-sm">
          No exams
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {allExams.map((ex, idx) => (
          <Badge
            key={ex._id || idx}
            variant="secondary"
            className={`text-xs whitespace-nowrap ${
              ex.isPractical
                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
            }`}
          >
            {ex.exam?.name || ex.exam_component?.name || "Unnamed Exam"}{ex.isPractical ? " (Pr.)" : ""}
          </Badge>
        ))}
      </div>
    );
  };

  const getExamTeachers = (planning) => {
    const seen = new Map();

    if (planning?.exams) {
      planning.exams.forEach((ex) => {
        const person = ex.teacher;
        if (person && person._id && !seen.has(person._id)) {
          seen.set(person._id, {
            _id: person._id,
            name: `${person.last_name || ""} ${person.first_name || ""}`.trim() || person.name || "Unknown",
            status: ex.teacher_status || "pending",
            role: "Exam",
          });
        }
      });
    }

    if (planning?.practical_exams) {
      planning.practical_exams.forEach((ex) => {
        if (!ex.teachers) return;
        ex.teachers.forEach((item) => {
          const person = item.teacher;
          if (person && person._id && !seen.has(person._id)) {
            seen.set(person._id, {
              _id: person._id,
              name: `${person.last_name || ""} ${person.first_name || ""}`.trim() || person.name || "Unknown",
              status: item.status || "pending",
              role: "Pr. Exam",
            });
          }
        });
      });
    }

    return Array.from(seen.values());
  };

  const renderExamTeachersColumn = (planning) => {
    const teachers = getExamTeachers(planning);

    if (teachers.length === 0) {
      return <span className="text-gray-500 text-sm">No exam teachers</span>;
    }

    const getBadgeColor = (status) => {
      switch (status?.toLowerCase()) {
        case "accepted":
          return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
        case "rejected":
          return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
        case "pending":
        default:
          return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      }
    };

    return (
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {teachers.map((p) => (
          <Badge
            key={p._id}
            variant="outline"
            className={`text-xs whitespace-nowrap ${getBadgeColor(p.status)}`}
            title={`${p.name} (${p.role})`}
          >
            {p.name}
          </Badge>
        ))}
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
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder={t("planningManagement.search")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <PlanningFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
            activeCity={activeCity}
          />
        </div>
        {canModify && (
          <Button onClick={handleOpenCreate}>
            {t("planningManagement.createPlanning")}
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("planningManagement.table.program")}</TableHead>
            <TableHead>{t("planningManagement.table.batch")}</TableHead>
            <TableHead>{t("planningManagement.table.module")}</TableHead>
            <TableHead>Sequence</TableHead>
            <TableHead>Year</TableHead>
            <TableHead className="text-center">Students</TableHead>
            <TableHead>Session Start Date</TableHead>
            <TableHead>Session End Date</TableHead>
            <TableHead>{t("planningManagement.table.venue")}</TableHead>
            <TableHead>{t("planningManagement.table.exams", "Exams")}</TableHead>
            <TableHead>{t("planningManagement.table.examTeachers", "Exam Teachers")}</TableHead>
            <TableHead>{t("planningManagement.table.teachers")}</TableHead>
            <TableHead>{t("planningManagement.table.assistants", "Assistants")}</TableHead>
            <TableHead>{t("planningManagement.table.trainees", "Trainees")}</TableHead>
            <TableHead>{t("planningManagement.table.status")}</TableHead>
            <TableHead>{t("planningManagement.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={16} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={16} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message ||
                    t("planningManagement.messages.loadFailed")
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
                  {i?.component?.module_number ? i.component.module_number : "N/A"}
                </TableCell>
                <TableCell>{i?.cohort_year || "N/A"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 justify-center">
                    <Users size={14} className="text-sidebar-foreground/40" />
                    <span className="font-semibold text-sidebar-foreground/80">
                      {i?.student_count || 0}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {getSessionStartDate(i?.sessions)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {getSessionEndDate(i?.sessions)}
                </TableCell>
                <TableCell
                  className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={i?.venue}
                >
                  {i?.venue || "N/A"}
                </TableCell>
                <TableCell>{renderExamChips(i?.exams, i?.practical_exams)}</TableCell>
                <TableCell>{renderExamTeachersColumn(i)}</TableCell>
                <TableCell>{renderPersonnelChips(i?.sessions, 'teachers')}</TableCell>
                <TableCell>{renderPersonnelChips(i?.sessions, 'assistants')}</TableCell>
                <TableCell>{renderPersonnelChips(i?.sessions, 'trainees')}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canModify && (
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
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={16} className="text-center">
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlanning(null);
        }}
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
