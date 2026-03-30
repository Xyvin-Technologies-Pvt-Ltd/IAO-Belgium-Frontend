import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { useGetUsers } from "@/store/useDropdownStore";
import {
  useCreateAdminNotification,
  useUpdateAdminNotification,
} from "@/store/useNotificationStore";

// "all" → all users, "teacher" → teachers, "student" → students
const ROLE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "teacher", label: "Teachers" },
  { value: "student", label: "Students" },
];

const NotificationModal = ({ open, onClose, notification = null }) => {
  const isEdit = !!notification;

  const [targetRole, setTargetRole] = useState(() => notification?.target_role || "all");
  const [isAll, setIsAll] = useState(() => notification?.is_all || false);
  const [selectedUsers, setSelectedUsers] = useState(() => notification?.recipient_users || []);
  const [userSearch, setUserSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState(() => notification?.type?.length ? notification.type : ["in-app"]);

  // Only fetch users when a specific role is selected and not sending to all
  const { data: usersData, isLoading: usersLoading } = useGetUsers(
    { role: targetRole, ...(userSearch ? { search: userSearch } : {}) },
    { enabled: targetRole !== "all" && !isAll }
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { subject: "", message: "" } });

  useEffect(() => {
    if (open) {
      reset({ subject: notification?.subject || "", message: notification?.message || "" });
      setTargetRole(notification?.target_role || "all");
      setIsAll(notification?.is_all ?? false);
      setSelectedUsers(notification?.recipient_users || []);
      setUserSearch("");
      setSelectedTypes(notification?.type?.length ? notification.type : ["in-app"]);
    } else {
      reset({ subject: "", message: "" });
      setTargetRole("all");
      setIsAll(false);
      setSelectedUsers([]);
      setUserSearch("");
      setSelectedTypes(["in-app"]);
    }
  }, [notification, open]);

  const handleRoleChange = (value) => {
    if (!value) return;
    setTargetRole(value);
    setSelectedUsers([]);
    setIsAll(value === "all");
  };

  const createMutation = useCreateAdminNotification();
  const updateMutation = useUpdateAdminNotification();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data) => {
    const payload = {
      subject: data.subject,
      message: data.message,
      type: selectedTypes,
      users: targetRole === "all" || isAll ? ["*"] : selectedUsers.map((u) => u._id),
      target_role: targetRole,
      status: "drafted",
    };

    if (isEdit) {
      updateMutation.mutate({ id: notification._id, data: payload }, { onSuccess: handleClose });
    } else {
      createMutation.mutate(payload, { onSuccess: handleClose });
    }
  };

  const handleClose = () => {
    onClose();
  };

  const canSubmit =
    selectedTypes.length > 0 &&
    (targetRole === "all" || isAll || selectedUsers.length > 0);

  // Keep hooks above this guard
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-[520px] min-h-[600px] max-h-[92vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Notification" : "Create Notification"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isEdit ? "Update the notification details" : "Draft a new notification"}
            </p>
          </div>
          <button onClick={handleClose} className="cursor-pointer text-muted-foreground hover:text-gray-700 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Subject <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Notification subject"
              {...register("subject", { required: "Subject is required" })}
            />
            {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Message <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Notification message"
              rows={4}
              {...register("message", { required: "Message is required" })}
            />
            {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
          </div>

          {/* Type checkboxes */}
          <div className="space-y-2">
            <Label>Type <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-6">
              {["in-app", "email"].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={(e) =>
                      setSelectedTypes((prev) =>
                        e.target.checked ? [...prev, type] : prev.filter((t) => t !== type)
                      )
                    }
                    className="w-4 h-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm">{type === "in-app" ? "In-App" : "Email"}</span>
                </label>
              ))}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-xs text-red-500">Select at least one type</p>
            )}
          </div>

          {/* Target role — Select */}
          <div className="space-y-1.5">
            <Label>Send To <span className="text-red-500">*</span></Label>
            <Select value={targetRole} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipients..." />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* "All users" is implicit when targetRole === "all" */}
          {targetRole !== "all" && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAll}
                  onChange={(e) => {
                    setIsAll(e.target.checked);
                    setSelectedUsers([]);
                  }}
                  className="w-4 h-4 rounded border-input accent-primary"
                />
                <span className="text-sm">
                  Send to all {targetRole === "teacher" ? "teachers" : "students"}
                </span>
              </label>

              {!isAll && (
                <SearchableMultiSelect
                  label={targetRole === "teacher" ? "Select Teachers" : "Select Students"}
                  placeholder={`Search ${targetRole === "teacher" ? "teachers" : "students"}...`}
                  items={usersData?.data || []}
                  selected={selectedUsers}
                  onChange={setSelectedUsers}
                  onSearch={setUserSearch}
                  isLoading={usersLoading}
                  error={!selectedUsers.length ? "Select at least one recipient" : null}
                />
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationModal;
