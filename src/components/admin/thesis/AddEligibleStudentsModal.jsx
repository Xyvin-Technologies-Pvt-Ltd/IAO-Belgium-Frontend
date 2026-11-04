import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { useTranslation } from "react-i18next";
import { useGetUsers } from "@/store/useDropdownStore";
import { useAddTrajectoryEligibleStudents } from "@/store/useThesisStore";

const AddEligibleStudentsModal = ({
  open,
  onClose,
  thesisId,
  trajectoryId,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  const { data: usersData, isLoading: isStudentsLoading } = useGetUsers(
    {
      role: "student",
      ...(searchTerm ? { search: searchTerm } : {}),
    },
    { enabled: open && !!thesisId && !!trajectoryId }
  );

  const addEligibleStudents = useAddTrajectoryEligibleStudents();

  const handleClose = () => {
    setSelectedStudents([]);
    setSearchTerm("");
    onClose();
  };

  const studentItems = useMemo(() => {
    const rawStudents = usersData?.data || [];

    return rawStudents.map((s) => {
      const fullName =
        s.name ||
        `${s.first_name || ""} ${s.last_name || ""}`.trim() ||
        s.email ||
        "Student";
      return {
        _id: String(s._id),
        name: fullName,
        fullName,
        email: s.email || "",
        raw: s,
      };
    });
  }, [usersData?.data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0 || !thesisId || !trajectoryId) return;

    addEligibleStudents.mutate(
      {
        thesisId,
        trajectoryId,
        userIds: selectedStudents.map((item) => item._id),
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t(
              "thesisManagement.trajectories.addEligibleStudentsTitle",
              "Add Eligible Students"
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <SearchableMultiSelect
            label={t(
              "thesisManagement.trajectories.selectStudents",
              "Select Students"
            )}
            placeholder={t(
              "thesisManagement.trajectories.selectStudentsPlaceholder",
              "Search and select students..."
            )}
            searchPlaceholder={t(
              "thesisManagement.trajectories.searchStudentsPlaceholder",
              "Search by student name, email or UID..."
            )}
            items={studentItems}
            selected={selectedStudents}
            onChange={setSelectedStudents}
            onSearch={setSearchTerm}
            isLoading={isStudentsLoading}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addEligibleStudents.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                selectedStudents.length === 0 || addEligibleStudents.isPending
              }
            >
              {addEligibleStudents.isPending
                ? t("common.adding", "Adding...")
                : selectedStudents.length > 1
                  ? t(
                      "thesisManagement.trajectories.addStudentsCount",
                      "Add {{count}} Students",
                      { count: selectedStudents.length }
                    )
                  : t(
                      "thesisManagement.trajectories.addStudent",
                      "Add Student"
                    )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEligibleStudentsModal;
