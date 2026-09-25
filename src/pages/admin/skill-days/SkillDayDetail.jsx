import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Pagination } from "@/components/ui/table/Pagination";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import {
  useGetSkillDayById,
  useRemoveAttachment,
} from "@/store/useSkillDayStore";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import CreateSkillDayModal from "@/components/admin/skill-days/CreateSkillDayModal";
import AttachGroupModal from "@/components/admin/skill-days/AttachGroupModal";
import DeleteConfirm from "@/components/DeleteConfirm";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";
import { useTranslation } from "react-i18next";

const SkillDayDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isEditDetailOpen, setIsEditDetailOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState(null);

  const [deleteAttachmentId, setDeleteAttachmentId] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);

  const { data, isLoading, error, refetch } = useGetSkillDayById(id, {
    page,
    limit: rowsPerPage,
  });
  const { mutateAsync: removeAttachment, isPending: isRemoving } =
    useRemoveAttachment();

  const skillDay = data?.data || null;
  const totalRows = data?.total_count || 0;

  // Breadcrumb Top Navigation matching ProgramDetail pattern
  useEffect(() => {
    if (skillDay) {
      updateBreadcrumbs([
        {
          label: t("sidebar.admin.planning", "Planning"),
          path: "/admin/planning",
          navigable: true,
        },
        {
          label: t("sidebar.admin.skillDays", "Standalone Modules"),
          path: "/admin/standalone-modules",
          navigable: true,
        },
        {
          label: skillDay.name || "Standalone Module Detail",
          path: `/admin/standalone-modules/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [skillDay?.name, id, updateBreadcrumbs, t]);

  const handleEditAttachment = (att) => {
    setEditingAttachment(att);
    setIsAttachModalOpen(true);
  };

  const handleAddAttachment = () => {
    setEditingAttachment(null);
    setIsAttachModalOpen(true);
  };

  const handleRemoveClick = (attachmentId) => {
    setDeleteAttachmentId(attachmentId);
    setOpenDelete(true);
  };

  const handleConfirmRemove = async () => {
    try {
      await removeAttachment({
        skillDayId: id,
        attachmentId: deleteAttachmentId,
      });
    } finally {
      setDeleteAttachmentId(null);
      setOpenDelete(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="Loading Standalone Module details..." fullHeight />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || "Failed to load Standalone Module details"}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  if (!skillDay) return null;

  const attachments = skillDay.attachments || [];

  return (
    <div className="space-y-6">
      {/* Top Header Bar matching Program Details */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("sidebar.admin.skillDays", "Standalone Modules")} — <span className="font-medium text-gray-700 dark:text-gray-300">{skillDay.name}</span>
          </h2>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsEditDetailOpen(true)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit details
        </Button>
      </div>

      {/* Dashboard Cards matching Program Detail Page styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="DATE / TIME"
          value={`${moment(skillDay.start_date).format("DD/MM/YYYY")} — ${moment(skillDay.end_date).format("DD/MM/YYYY")}`}
          subtitle={
            skillDay.start_time && skillDay.end_time
              ? `Time: ${skillDay.start_time} - ${skillDay.end_time}`
              : "Standalone Module Session Schedule"
          }
          icon={Calendar}
        />

        <DashboardCard
          title="LOCATION"
          value={skillDay.venue || skillDay.location}
          subtitle={
            skillDay.city?.name
              ? `${skillDay.city.name}${skillDay.city.country?.name ? `, ${skillDay.city.country.name}` : ""}`
              : skillDay.venue_address || "Venue Address"
          }
          icon={MapPin}
        />

        <DashboardCard
          title="ATTACHED GROUPS"
          value={totalRows}
          subtitle="Total Attached Groups & Program Years"
          icon={Users}
        />
      </div>

      {/* Description Section */}
      {skillDay.description && (
        <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl p-5 space-y-2 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Description / Context
          </h3>
          <div
            className="prose dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: skillDay.description }}
          />
        </div>
      )}

      {/* Attachments Subheader & Button */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Attached Groups
          </h3>
          <Button
            onClick={handleAddAttachment}
            className="flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Attach group
          </Button>
        </div>

        {/* Table matching Program details structure */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GROUP</TableHead>
              <TableHead>YEAR</TableHead>
              <TableHead>REQUIREMENT</TableHead>
              <TableHead>COST</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attachments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  No groups attached yet. Click "+ Attach group" to add one.
                </TableCell>
              </TableRow>
            ) : (
              attachments.map((att) => {
                const batchName = att.batch?.name || "Group Batch";
                return (
                  <TableRow
                    key={att._id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: `/admin/standalone-modules/${id}/attachment/${att._id}`,
                      })
                    }
                  >
                    <TableCell className="font-semibold text-foreground">
                      {batchName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Year {att.year}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={att.requirement === "required" ? "required" : "optional"} />
                    </TableCell>
                    <TableCell>
                      {att.cost_type === "paid" ? (
                        <span className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                          Paid ({att.currency || "EUR"} {att.amount || 0})
                        </span>
                      ) : (
                        <StatusBadge status="free" />
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <RowActionMenu
                        actions={[
                          {
                            label: "View Students",
                            icon: Users,
                            onClick: () =>
                              navigate({
                                to: `/admin/standalone-modules/${id}/attachment/${att._id}`,
                              }),
                          },
                          {
                            label: "Edit",
                            icon: Edit,
                            onClick: () => handleEditAttachment(att),
                          },
                          {
                            label: "Detach",
                            icon: Trash2,
                            className: "text-red-600 dark:text-red-400",
                            onClick: () => handleRemoveClick(att._id),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
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
      </div>

      {/* Modals */}
      <CreateSkillDayModal
        open={isEditDetailOpen}
        onClose={() => setIsEditDetailOpen(false)}
        skillDayData={skillDay}
      />

      <AttachGroupModal
        open={isAttachModalOpen}
        onClose={() => {
          setIsAttachModalOpen(false);
          setEditingAttachment(null);
        }}
        skillDayId={id}
        attachmentData={editingAttachment}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmRemove}
        isLoading={isRemoving}
      />
    </div>
  );
};

export default SkillDayDetail;
