import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useTranslation } from "react-i18next";
import { useGetTeachers } from "@/store/useTeacherStore";
import { useAssignThesisTeacher, useGetThesisTeachers } from "@/store/useThesisStore";

const AssignThesisTeacherModal = ({
  open,
  onClose,
  thesisId,
  assignedTeacherIds = [],
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const { data: allAssignedResponse } = useGetThesisTeachers(
    thesisId,
    { all: true },
    { enabled: open && !!thesisId }
  );

  const { data: teachersResponse, isLoading } = useGetTeachers(
    {
      status: "active",
      limit: 100,
      ...(searchTerm ? { search: searchTerm } : {}),
    },
    { enabled: open }
  );

  const assignTeacher = useAssignThesisTeacher();

  const handleClose = () => {
    setSearchTerm("");
    setSelectedTeacherId("");
    onClose();
  };

  const teachers = teachersResponse?.data || [];

  // Filter out teachers already active on this thesis (across all pages)
  const teacherItems = useMemo(() => {
    const fromProps = assignedTeacherIds || [];
    const fromApi = (allAssignedResponse?.data || []).map((a) => a.teacher?._id);
    const assignedSet = new Set(
      [...fromProps, ...fromApi].filter(Boolean).map(String)
    );
    return teachers
      .filter((tch) => !assignedSet.has(String(tch._id)))
      .map((tch) => {
        const fullName =
          `${tch.first_name || ""} ${tch.last_name || ""}`.trim() ||
          tch.email ||
          "Teacher";
        return {
          _id: String(tch._id),
          name: fullName,
          fullName,
          email: tch.email || "",
          raw: tch,
        };
      });
  }, [teachers, assignedTeacherIds, allAssignedResponse?.data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeacherId || !thesisId) return;

    assignTeacher.mutate(
      { thesisId, teacherId: selectedTeacherId },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(
              "thesisManagement.teachers.assignTeacherTitle",
              "Assign Teacher to Thesis"
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <SearchableSelect
            label={t(
              "thesisManagement.teachers.selectTeacherLabel",
              "Select Teacher"
            )}
            placeholder={t(
              "thesisManagement.teachers.selectTeacherPlaceholder",
              "Search and select a teacher..."
            )}
            searchPlaceholder={t(
              "thesisManagement.teachers.searchTeacherPlaceholder",
              "Search by teacher name or email..."
            )}
            items={teacherItems}
            value={selectedTeacherId}
            onChange={(val) => setSelectedTeacherId(val)}
            onSearch={setSearchTerm}
            isLoading={isLoading}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={assignTeacher.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!selectedTeacherId || assignTeacher.isPending}
            >
              {assignTeacher.isPending
                ? t("thesisManagement.teachers.assigning", "Assigning...")
                : t("thesisManagement.teachers.assignButton", "Assign Teacher")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignThesisTeacherModal;
