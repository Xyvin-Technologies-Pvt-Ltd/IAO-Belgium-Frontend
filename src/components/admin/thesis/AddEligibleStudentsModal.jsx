import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { useTranslation } from "react-i18next";
import { useGetUsers } from "@/store/useDropdownStore";
import {
  useAddThesisEligibleStudents,
  useMatchingEligibleApplications,
} from "@/store/useThesisStore";

const appLabel = (app) => {
  const program = app?.program?.name || "";
  const uid = app?.application_uid || "";
  const intake = app?.intake_name || "";
  const parts = [program, uid, intake].filter(Boolean);
  return parts.join(" · ") || app?.application_id || "Enrolment";
};

const AddEligibleStudentsModal = ({ open, onClose, thesisId }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [matchingByUser, setMatchingByUser] = useState({});
  const [pickedApps, setPickedApps] = useState({});
  const [resolveError, setResolveError] = useState("");

  const { data: usersData, isLoading: isStudentsLoading } = useGetUsers(
    {
      role: "student",
      ...(searchTerm ? { search: searchTerm } : {}),
    },
    { enabled: open && !!thesisId }
  );

  const addEligibleStudents = useAddThesisEligibleStudents();
  const matchingMutation = useMatchingEligibleApplications();

  const handleClose = () => {
    setSelectedStudents([]);
    setSearchTerm("");
    setMatchingByUser({});
    setPickedApps({});
    setResolveError("");
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

  const selectedIds = useMemo(
    () => selectedStudents.map((s) => String(s._id)),
    [selectedStudents]
  );

  useEffect(() => {
    if (!open || !thesisId || selectedIds.length === 0) {
      setMatchingByUser({});
      setPickedApps({});
      setResolveError("");
      return;
    }

    let cancelled = false;
    setResolveError("");
    matchingMutation.mutate(
      { thesisId, userIds: selectedIds },
      {
        onSuccess: (res) => {
          if (cancelled) return;
          const users = res?.data?.users || [];
          const next = {};
          const nextPicks = {};
          for (const u of users) {
            const uid = String(u.user_id);
            next[uid] = u;
            if (u.applications?.length === 1) {
              nextPicks[uid] = u.applications[0].application_id;
            } else if (u.applications?.length > 1) {
              // keep existing pick if still valid
              const prev = pickedApps[uid];
              const still =
                prev &&
                u.applications.some((a) => a.application_id === prev);
              if (still) nextPicks[uid] = prev;
            }
          }
          setMatchingByUser(next);
          setPickedApps(nextPicks);
        },
        onError: (err) => {
          if (cancelled) return;
          setResolveError(
            err?.message || "Failed to resolve matching enrolments"
          );
        },
      }
    );

    return () => {
      cancelled = true;
    };
    // intentionally only re-resolve when selection/thesis changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, thesisId, selectedIds.join(",")]);

  const multiAppUsers = useMemo(() => {
    return selectedIds
      .map((id) => matchingByUser[id])
      .filter((u) => u && (u.applications?.length || 0) > 1);
  }, [selectedIds, matchingByUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0 || !thesisId) return;

    const applications = [];
    const missing = [];
    const ambiguous = [];

    for (const id of selectedIds) {
      const match = matchingByUser[id];
      const apps = match?.applications || [];
      if (!apps.length) {
        missing.push(match?.email || match?.uid || id);
        continue;
      }
      if (apps.length === 1) {
        applications.push({
          user_id: id,
          application_id: apps[0].application_id,
        });
        continue;
      }
      const picked = pickedApps[id];
      if (!picked) {
        ambiguous.push(match?.email || match?.uid || id);
        continue;
      }
      applications.push({ user_id: id, application_id: picked });
    }

    if (missing.length || ambiguous.length) {
      const parts = [];
      if (missing.length) {
        parts.push(
          t(
            "thesisManagement.trajectories.noMatchingEnrolment",
            "No matching approved enrolment for: {{list}}",
            { list: missing.join(", ") }
          )
        );
      }
      if (ambiguous.length) {
        parts.push(
          t(
            "thesisManagement.trajectories.pickEnrolmentFor",
            "Pick an enrolment for: {{list}}",
            { list: ambiguous.join(", ") }
          )
        );
      }
      setResolveError(parts.join(". "));
      return;
    }

    addEligibleStudents.mutate(
      {
        thesisId,
        applications,
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

          {multiAppUsers.length > 0 && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <p className="text-sm text-muted-foreground">
                {t(
                  "thesisManagement.trajectories.pickEnrolmentHint",
                  "These students have more than one matching enrolment. Pick which one to add."
                )}
              </p>
              {multiAppUsers.map((u) => {
                const uid = String(u.user_id);
                const label =
                  `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                  u.email ||
                  u.uid ||
                  uid;
                return (
                  <div key={uid} className="space-y-1.5">
                    <Label className="text-sm font-medium">{label}</Label>
                    <Select
                      value={pickedApps[uid] || ""}
                      onValueChange={(val) =>
                        setPickedApps((prev) => ({ ...prev, [uid]: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "thesisManagement.trajectories.selectEnrolment",
                            "Select enrolment"
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {u.applications.map((app) => (
                          <SelectItem
                            key={app.application_id}
                            value={app.application_id}
                          >
                            {appLabel(app)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}

          {resolveError ? (
            <p className="text-sm text-destructive">{resolveError}</p>
          ) : null}

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
                selectedStudents.length === 0 ||
                addEligibleStudents.isPending ||
                matchingMutation.isPending
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
