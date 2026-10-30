import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdateExternalThesisTeacher } from "@/store/useThesisStore";

const EditExternalTeacherModal = ({ open, onClose, thesisId, assignment }) => {
  const { t } = useTranslation();
  const updateExternalTeacher = useUpdateExternalThesisTeacher();

  const [form, setForm] = useState(() => ({
    first_name: assignment?.external_profile?.first_name || "",
    last_name: assignment?.external_profile?.last_name || "",
    email: assignment?.external_profile?.email || "",
    phone: assignment?.external_profile?.phone || "",
  }));

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !assignment?._id)
      return;

    updateExternalTeacher.mutate(
      {
        thesisId,
        assignmentId: assignment._id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(
              "thesisManagement.teachers.editExternalTitle",
              "Edit External Teacher"
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-ext-first-name">
                {t("thesisManagement.teachers.firstName", "First Name")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-ext-first-name"
                value={form.first_name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                placeholder={t(
                  "thesisManagement.teachers.firstNamePlaceholder",
                  "e.g. Jane"
                )}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-ext-last-name">
                {t("thesisManagement.teachers.lastName", "Last Name")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-ext-last-name"
                value={form.last_name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
                placeholder={t(
                  "thesisManagement.teachers.lastNamePlaceholder",
                  "e.g. Doe"
                )}
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-ext-email">
              {t("thesisManagement.teachers.email", "Email")}
            </Label>
            <Input
              id="edit-ext-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="name@organization.com"
              maxLength={120}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-ext-phone">
              {t("thesisManagement.teachers.phone", "Phone")}
            </Label>
            <Input
              id="edit-ext-phone"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              placeholder="+32 ..."
              maxLength={30}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateExternalTeacher.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                !form.first_name.trim() ||
                !form.last_name.trim() ||
                updateExternalTeacher.isPending
              }
            >
              {updateExternalTeacher.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  {t("common.saving", "Saving...")}
                </>
              ) : (
                t("common.saveChanges", "Save Changes")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExternalTeacherModal;
