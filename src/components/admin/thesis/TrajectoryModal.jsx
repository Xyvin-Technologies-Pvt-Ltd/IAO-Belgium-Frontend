import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import {
  useCreateThesisTrajectory,
  useUpdateThesisTrajectory,
} from "@/store/useThesisStore";

const TrajectoryModal = ({ open, onClose, thesisId, initialData }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [errors, setErrors] = useState({});

  const createTrajectory = useCreateThesisTrajectory();
  const updateTrajectory = useUpdateThesisTrajectory();

  const isPending = createTrajectory.isPending || updateTrajectory.isPending;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setStartDate(
        initialData.start_date
          ? moment(initialData.start_date).format("YYYY-MM-DD")
          : ""
      );
    } else {
      setName("");
      setStartDate("");
    }
    setErrors({});
  }, [initialData, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = t("thesisManagement.trajectories.nameRequired", "Trajectory name is required");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isPending) return;

    const payload = {
      name: name.trim(),
      start_date: startDate ? new Date(startDate).toISOString() : null,
    };

    try {
      if (initialData?._id) {
        await updateTrajectory.mutateAsync({
          thesisId,
          trajectoryId: initialData._id,
          data: payload,
        });
      } else {
        await createTrajectory.mutateAsync({
          thesisId,
          data: payload,
        });
      }
      onClose();
    } catch {
      // Error handled by store toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? t("thesisManagement.trajectories.editTitle", "Edit Trajectory")
              : t("thesisManagement.trajectories.addTitle", "Add Trajectory")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Trajectory Name */}
          <div className="space-y-1.5">
            <Label htmlFor="trajectory-name">
              {t("thesisManagement.trajectories.name", "Trajectory Name")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="trajectory-name"
              placeholder={t(
                "thesisManagement.trajectories.namePlaceholder",
                "Enter trajectory name"
              )}
              value={name}
              disabled={isPending}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <Label htmlFor="trajectory-start-date">
              {t("thesisManagement.trajectories.startDate", "Start Date")}
            </Label>
            <Input
              id="trajectory-start-date"
              type="date"
              value={startDate}
              disabled={isPending}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (errors.startDate) {
                  setErrors((prev) => ({ ...prev, startDate: undefined }));
                }
              }}
            />
            {errors.startDate && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.startDate}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t("common.saving", "Saving...")
                : initialData
                ? t("common.update", "Update")
                : t("common.save", "Save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TrajectoryModal;
