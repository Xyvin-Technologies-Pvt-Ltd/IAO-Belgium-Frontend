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
import { getMoment } from "@/utils/dateUtils";

const PlanningTable = ({ activeCity, setActiveCity }) => {
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

  // Reset page when city or search changes
  useEffect(() => {
    setPage(1);
  }, [activeCity, debouncedSearch]);

  const { data, isLoading, isFetching, error, refetch } = useGetPlanning({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(activeCity !== "all" ? { city: activeCity } : {}),
    status: "active",
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
            <TableHead>Year</TableHead>
            <TableHead>Session Start Date</TableHead>
            <TableHead>Session End Date</TableHead>
            <TableHead>{t("planningManagement.table.venue")}</TableHead>
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
            <TableSkeleton rows={rowsPerPage} columns={12} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center p-8">
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
                <TableCell>{i?.cohort_year || "N/A"}</TableCell>
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
                <TableCell>{renderPersonnelChips(i?.sessions, 'teachers')}</TableCell>
                <TableCell>{renderPersonnelChips(i?.sessions, 'assistants')}</TableCell>
                <TableCell>{renderPersonnelChips(i?.sessions, 'trainees')}</TableCell>
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
              <TableCell colSpan={12} className="text-center">
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
