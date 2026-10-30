import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Compass,
  Plus,
  Calendar,
  Users,
  Edit,
  Trash2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import moment from "moment";
import { Button } from "@/components/ui/button";
import {
  useGetThesisTrajectories,
  useDeleteThesisTrajectory,
} from "@/store/useThesisStore";
import TrajectoryModal from "./TrajectoryModal";
import DeleteConfirm from "@/components/DeleteConfirm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TrajectoryList = ({ thesisId, canModify }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: trajectoriesResponse,
    isLoading,
  } = useGetThesisTrajectories(thesisId);

  const deleteTrajectory = useDeleteThesisTrajectory();

  const trajectories = trajectoriesResponse?.data || [];

  const [openModal, setOpenModal] = useState(false);
  const [editingTrajectory, setEditingTrajectory] = useState(null);
  const [deletingTrajectory, setDeletingTrajectory] = useState(null);
  const [enrolledWarningTrajectory, setEnrolledWarningTrajectory] =
    useState(null);

  const handleOpenAdd = () => {
    setEditingTrajectory(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (traj) => {
    setEditingTrajectory(traj);
    setOpenModal(true);
  };

  const handleOpenDelete = (traj) => {
    if ((traj.enrolled_count || 0) > 0) {
      setEnrolledWarningTrajectory(traj);
    } else {
      setDeletingTrajectory(traj);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTrajectory) return;
    try {
      await deleteTrajectory.mutateAsync({
        thesisId,
        trajectoryId: deletingTrajectory._id,
      });
      setDeletingTrajectory(null);
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {t("thesisManagement.trajectories.title", "Trajectories")}
            </h3>
          </div>
        </div>

        {canModify && (
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            {t("thesisManagement.trajectories.addTrajectory", "Add Trajectory")}
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t("common.loading", "Loading trajectories...")}
        </div>
      ) : trajectories.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Compass className="w-6 h-6 opacity-60" />
          </div>
          <h4 className="text-sm font-medium text-foreground">
            {t(
              "thesisManagement.trajectories.emptyTitle",
              "No trajectories defined yet"
            )}
          </h4>
          {canModify && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAdd}
              className="gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              {t(
                "thesisManagement.trajectories.addTrajectory",
                "Add Trajectory"
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {trajectories.map((traj) => (
            <div
              key={traj._id}
              onClick={() =>
                navigate({
                  to: "/admin/thesis/$id/trajectories/$trajectoryId",
                  params: { id: thesisId, trajectoryId: traj._id },
                })
              }
              className="group bg-muted/20 hover:bg-muted/40 border border-border/70 hover:border-primary/50 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between gap-3 shadow-2xs cursor-pointer hover:shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-foreground text-sm truncate" title={traj.name}>
                    {traj.name}
                  </h4>
                  {canModify && (
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(traj);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDelete(traj);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    {t("thesisManagement.trajectories.startsOn", "Starts:")}{" "}
                    <strong className="text-foreground font-medium">
                      {traj.start_date
                        ? moment(traj.start_date).format("DD/MM/YYYY")
                        : "—"}
                    </strong>
                  </span>
                </div>

                {Array.isArray(traj.step_deadlines) && traj.step_deadlines.length > 0 && (
                  <div className="pt-2 border-t border-border/40 space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {t("thesisManagement.trajectories.stepDeadlines", "Step Deadlines")}
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                      {traj.step_deadlines.map((sd, sIdx) => (
                        <div
                          key={sd.step_id || sIdx}
                          className="flex items-center justify-between text-xs py-0.5 gap-2"
                        >
                          <span
                            className="truncate text-foreground/85 font-medium"
                            title={sd.step_name}
                          >
                            {sd.sequence ? `${sd.sequence}. ` : ""}{sd.step_name}
                          </span>
                          <span className="font-semibold text-foreground shrink-0 text-[11px]">
                            {moment(sd.deadline_date).format("DD/MM/YYYY")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {t(
                    "thesisManagement.trajectories.enrolledStudentsCount",
                    "{{count}} Enrolled",
                    { count: traj.enrolled_count ?? 0 }
                  )}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {t("thesisManagement.trajectories.active", "Active")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Trajectory Modal */}
      <TrajectoryModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        thesisId={thesisId}
        initialData={editingTrajectory}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirm
        open={!!deletingTrajectory}
        onClose={() => setDeletingTrajectory(null)}
        onConfirm={handleConfirmDelete}
        count={1}
        data={deletingTrajectory?.name || "Trajectory"}
        isLoading={deleteTrajectory.isPending}
      />

      {/* Enrolled Students Blocking Alert Dialog */}
      <Dialog
        open={!!enrolledWarningTrajectory}
        onOpenChange={() => setEnrolledWarningTrajectory(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {t(
                "thesisManagement.trajectories.cannotDeleteTitle",
                "Cannot Delete Trajectory"
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm text-foreground/90">
            <p>
              {t(
                "thesisManagement.trajectories.cannotDeleteDesc",
                "This trajectory cannot be deleted because there are students already enrolled on it. All progress and submission histories are protected."
              )}
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 dark:text-amber-200 text-xs">
              <strong>{enrolledWarningTrajectory?.name}</strong> -{" "}
              {t(
                "thesisManagement.trajectories.enrolledNotice",
                "{{count}} active student enrolment(s)",
                { count: enrolledWarningTrajectory?.enrolled_count || 0 }
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setEnrolledWarningTrajectory(null)}
            >
              {t("common.close", "Close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrajectoryList;
