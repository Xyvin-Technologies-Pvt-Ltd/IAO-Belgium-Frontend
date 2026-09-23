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
import { useState, useEffect } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import {
  useGetSkillDays,
  useDeleteSkillDay,
} from "@/store/useSkillDayStore";
import CreateSkillDayModal from "@/components/admin/skill-days/CreateSkillDayModal";
import { useNavigate } from "@tanstack/react-router";
import moment from "moment";
import { Calendar, MapPin, Users, Eye, Edit, Trash2 } from "lucide-react";

const SkillDaysList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSkillDay, setSelectedSkillDay] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, refetch, isFetching } = useGetSkillDays({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const { mutateAsync: deleteSkillDay, isPending: isDeleting } =
    useDeleteSkillDay();

  const skillDays = data?.data || [];
  const totalRows = data?.total_count || data?.meta?.total || 0;

  const handleOpenCreate = () => {
    setSelectedSkillDay(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (skillDay) => {
    setSelectedSkillDay(skillDay);
    setIsModalOpen(true);
  };

  const handleRowDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteSkillDay(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const handleRowClick = (id) => {
    navigate({
      to: "/admin/standalone-modules/$id",
      params: { id: id },
    });
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Page Title */}
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("admin.skillDays.management", { defaultValue: `${t("sidebar.admin.skillDays", "Standalone Modules")} Management` })}
      </h2>

      {/* Action Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder={t("admin.skillDays.searchPlaceholder", "Search standalone modules...")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenCreate}>
            {t("admin.skillDays.createBtn", "Create Standalone Module")}
          </Button>
        </div>
      </div>

      {/* Program Section Table Layout */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.skillDays.nameCol", "Standalone Module Name")}</TableHead>
            <TableHead>Date Range</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Attached Groups</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("admin.skillDays.loadError", "Failed to load standalone modules")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : skillDays?.length > 0 ? (
            skillDays?.map((item) => (
              <TableRow
                key={item._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(item._id)}
              >
                <TableCell className="font-semibold text-foreground">
                  {item?.name}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {moment(item?.start_date).format("DD/MM/YYYY")} —{" "}
                    {moment(item?.end_date).format("DD/MM/YYYY")}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {item?.location}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 text-xs font-medium text-[#ff8904]">
                    <Users className="h-3.5 w-3.5" />
                    {item?.attachments?.length || 0} attached
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: "View Details",
                        icon: Eye,
                        onClick: () => handleRowClick(item._id),
                      },
                      {
                        label: "Edit",
                        icon: Edit,
                        onClick: () => handleOpenEdit(item),
                      },
                      {
                        label: "Delete",
                        icon: Trash2,
                        onClick: () => handleRowDeleteClick(item._id),
                        className: "text-red-600 dark:text-red-400",
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                {t("admin.skillDays.noData", 'No standalone modules found. Click "Create Standalone Module" above to get started.')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />

      {/* Create / Edit Modal */}
      <CreateSkillDayModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        skillDayData={selectedSkillDay}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SkillDaysList;
