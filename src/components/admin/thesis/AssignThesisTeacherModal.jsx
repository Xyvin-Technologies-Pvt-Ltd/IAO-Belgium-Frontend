
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { useTranslation } from "react-i18next";
import { useGetTeachers } from "@/store/useTeacherStore";
import {
  useAssignThesisTeacher,
  useCreateExternalThesisTeacher,
  useGetThesisTeachers,
} from "@/store/useThesisStore";

const AssignThesisTeacherModal = ({
  open,
  onClose,
  thesisId,
  assignedTeacherIds = [],
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("internal");

  // Internal tab state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState([]);

  // External tab state
  const [externalForm, setExternalForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const { data: allAssignedResponse } = useGetThesisTeachers(
    thesisId,
    { all: true },
    { enabled: open && !!thesisId }
  );

  const { data: teachersResponse, isLoading: isTeachersLoading } = useGetTeachers(
    {
      status: "active",
      limit: 100,
      ...(searchTerm ? { search: searchTerm } : {}),
    },
    { enabled: open && activeTab === "internal" }
  );

  const assignTeacher = useAssignThesisTeacher();
  const createExternalTeacher = useCreateExternalThesisTeacher();

  const handleClose = () => {
    setSelectedTeachers([]);
    setSearchTerm("");
    setExternalForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
    });
    setActiveTab("internal");
    onClose();
  };

  // Filter out teachers already active on this thesis
  const teacherItems = useMemo(() => {
    const rawTeachers = teachersResponse?.data || [];
    const fromProps = assignedTeacherIds || [];
    const fromApi = (allAssignedResponse?.data || [])
      .filter((a) => a.teacher_type !== "external")
      .map((a) => a.teacher?._id);
    const assignedSet = new Set(
      [...fromProps, ...fromApi].filter(Boolean).map(String)
    );

    return rawTeachers
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
  }, [teachersResponse?.data, assignedTeacherIds, allAssignedResponse?.data]);

  const handleInternalSubmit = (e) => {
    e.preventDefault();
    if (selectedTeachers.length === 0 || !thesisId) return;

    assignTeacher.mutate(
      {
        thesisId,
        teacherIds: selectedTeachers.map((item) => item._id),
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleExternalSubmit = (e) => {
    e.preventDefault();
    if (
      !externalForm.first_name.trim() ||
      !externalForm.last_name.trim() ||
      !thesisId
    )
      return;

    createExternalTeacher.mutate(
      {
        thesisId,
        first_name: externalForm.first_name.trim(),
        last_name: externalForm.last_name.trim(),
        email: externalForm.email.trim() || undefined,
        phone: externalForm.phone.trim() || undefined,
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
              "thesisManagement.teachers.assignTeacherTitle",
              "Assign Teacher to Thesis"
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-sm font-medium mt-1">
          <button
            type="button"
            onClick={() => setActiveTab("internal")}
            className={`py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "internal"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("thesisManagement.teachers.tabInternal", "Internal")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("external")}
            className={`py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "external"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("thesisManagement.teachers.tabExternal", "External Teacher")}
          </button>
        </div>

        {/* Tab 1: Internal Teachers Multi-Select */}
        {activeTab === "internal" && (
          <form onSubmit={handleInternalSubmit} className="space-y-4 pt-2">
            <SearchableMultiSelect
              label={t(
                "thesisManagement.teachers.selectTeachers",
                "Select Teachers"
              )}
              placeholder={t(
                "thesisManagement.teachers.selectTeacherPlaceholder",
                "Search and select teachers..."
              )}
              searchPlaceholder={t(
                "thesisManagement.teachers.searchTeacherPlaceholder",
                "Search by teacher name or email..."
              )}
              items={teacherItems}
              selected={selectedTeachers}
              onChange={setSelectedTeachers}
              onSearch={setSearchTerm}
              isLoading={isTeachersLoading}
              required
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
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
                disabled={selectedTeachers.length === 0 || assignTeacher.isPending}
              >
                {assignTeacher.isPending
                  ? t("thesisManagement.teachers.assigning", "Assigning...")
                  : selectedTeachers.length > 1
                    ? `${t("thesisManagement.teachers.assignButton", "Assign")} (${selectedTeachers.length})`
                    : t("thesisManagement.teachers.assignButton", "Assign Teacher")}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: External Teacher Form */}
        {activeTab === "external" && (
          <form onSubmit={handleExternalSubmit} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ext-first-name">
                  {t("thesisManagement.teachers.firstName", "First Name")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ext-first-name"
                  value={externalForm.first_name}
                  onChange={(e) =>
                    setExternalForm((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  placeholder={t(
                    "thesisManagement.teachers.firstNamePlaceholder",
                    "e.g. John"
                  )}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ext-last-name">
                  {t("thesisManagement.teachers.lastName", "Last Name")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ext-last-name"
                  value={externalForm.last_name}
                  onChange={(e) =>
                    setExternalForm((prev) => ({
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
              <Label htmlFor="ext-email">
                {t("thesisManagement.teachers.email", "Email")}
              </Label>
              <Input
                id="ext-email"
                type="email"
                value={externalForm.email}
                onChange={(e) =>
                  setExternalForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="name@organization.com"
                maxLength={120}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ext-phone">
                {t("thesisManagement.teachers.phone", "Phone")}
              </Label>
              <Input
                id="ext-phone"
                value={externalForm.phone}
                onChange={(e) =>
                  setExternalForm((prev) => ({
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
                disabled={createExternalTeacher.isPending}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  !externalForm.first_name.trim() ||
                  !externalForm.last_name.trim() ||
                  createExternalTeacher.isPending
                }
              >
                {createExternalTeacher.isPending
                  ? t("common.saving", "Saving...")
                  : t(
                      "thesisManagement.teachers.addExternalTeacher",
                      "Add External Teacher"
                    )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignThesisTeacherModal;
