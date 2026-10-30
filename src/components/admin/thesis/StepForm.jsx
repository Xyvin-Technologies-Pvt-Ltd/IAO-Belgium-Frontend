import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/ui/RichTextEditor";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import {
  Plus,
  Trash2,
  Link as LinkIcon,
  AlertCircle,
  Upload,
  Eye,
  FileText,
  Loader2,
  Paperclip,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetThesisRoles } from "@/store/useThesisStore";
import { uploadFile } from "@/api/uploadApi";
import { openSecureFile } from "@/utils/secureFile";
import { toast } from "sonner";

const URL_PATTERN = /^https?:\/\/.+/i;

const STEP_TYPES = [
  { value: "document_upload", label: "Document upload" },
  { value: "teacher_approval", label: "Teacher approval" },
  { value: "information_only", label: "Information only" },
];

const DEADLINE_MODES = [
  { value: "none", label: "No deadline" },
  { value: "optional", label: "Deadline optional" },
  { value: "required", label: "Deadline required" },
  { value: "event_date", label: "Event date (information only)" },
];

const STEP_TYPE_HINT = {
  document_upload: "document upload",
  teacher_approval: "teacher approval",
};

const StepForm = ({
  open,
  onClose,
  onSave,
  initialData,
  siblingSteps = [],
  editingIndex = -1,
}) => {
  const { t } = useTranslation();

  const { data: rolesResponse, isLoading: isRolesLoading } = useGetThesisRoles({
    status: true,
  });
  const availableRoles = useMemo(() => {
    const list = rolesResponse?.data || [];
    return Array.isArray(list) ? list : [];
  }, [rolesResponse?.data]);

  const lockOptions = useMemo(() => {
    return (siblingSteps || [])
      .map((s, idx) => ({ step: s, idx }))
      .filter(({ step, idx }) => {
        if (editingIndex >= 0 && idx === editingIndex) return false;
        if (initialData?._id && step._id && String(step._id) === String(initialData._id)) {
          return false;
        }
        return step.type === "document_upload" || step.type === "teacher_approval";
      })
      .map(({ step, idx }) => {
        const mongoId =
          step._id && /^[0-9a-fA-F]{24}$/.test(String(step._id))
            ? String(step._id)
            : null;
        const value = mongoId || `__idx__:${idx}`;
        const typeHint = STEP_TYPE_HINT[step.type] || step.type;
        return {
          value,
          label: `${idx + 1}. ${step.name || "Untitled"} (${typeHint})`,
        };
      });
  }, [siblingSteps, editingIndex, initialData]);

  const [name, setName] = useState("");
  const [type, setType] = useState("document_upload");
  const [deadlineMode, setDeadlineMode] = useState("none");
  const [required, setRequired] = useState(true);
  const [studentUploadsDocument, setStudentUploadsDocument] = useState(true);
  const [lockedUntilStep, setLockedUntilStep] = useState("NONE");
  const [instruction, setInstruction] = useState("");
  const [resources, setResources] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);
  const [newDocName, setNewDocName] = useState("");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setType(initialData.type || "document_upload");
      setDeadlineMode(initialData.deadline_mode || "none");
      setRequired(
        initialData.required !== undefined ? initialData.required : true
      );
      setStudentUploadsDocument(
        initialData.student_uploads_document !== undefined
          ? Boolean(initialData.student_uploads_document)
          : true
      );
      let lockValue = "NONE";
      const rawLock = initialData.locked_until_step;
      if (rawLock) {
        const rawStr = String(
          typeof rawLock === "object" && rawLock?._id ? rawLock._id : rawLock
        );
        const match = lockOptions.find((o) => o.value === rawStr);
        if (match) lockValue = match.value;
      } else if (initialData.locked_until_supervisor) {
        const firstApproval = lockOptions.find((o) =>
          o.label.includes("(teacher approval)")
        );
        if (firstApproval) lockValue = firstApproval.value;
      }
      setLockedUntilStep(lockValue);
      setInstruction(initialData.instruction || "");
      setResources(
        Array.isArray(initialData.resources) && initialData.resources.length > 0
          ? initialData.resources.map((r) => ({
              label: r.label || "",
              url: r.url || "",
            }))
          : []
      );
      setAttachments(
        Array.isArray(initialData.attachments) && initialData.attachments.length > 0
          ? initialData.attachments.map((a) => ({
              name: a.name || "",
              file_url: a.file_url || "",
            }))
          : []
      );
      setPendingFile(null);
      setNewDocName("");
      const rawRoles = Array.isArray(initialData.approval_roles)
        ? initialData.approval_roles
        : [];
      const roleIds = rawRoles.map((r) =>
        typeof r === "object" && r?._id ? r._id : String(r)
      );
      const matched = availableRoles.filter((r) => roleIds.includes(String(r._id)));
      if (matched.length > 0) {
        setSelectedRoles(matched);
      } else if (rawRoles.length > 0 && typeof rawRoles[0] === "object") {
        setSelectedRoles(rawRoles);
      } else {
        setSelectedRoles(roleIds.map((id) => ({ _id: id, name: id })));
      }
    } else {
      setName("");
      setType("document_upload");
      setDeadlineMode("none");
      setRequired(true);
      setStudentUploadsDocument(true);
      setLockedUntilStep("NONE");
      setInstruction("");
      setResources([]);
      setAttachments([]);
      setPendingFile(null);
      setNewDocName("");
      setSelectedRoles([]);
    }
    setErrors({});
  }, [initialData, open, availableRoles, lockOptions]);

  // Synchronize role display names if availableRoles finishes loading after initialData
  useEffect(() => {
    if (availableRoles.length > 0 && selectedRoles.length > 0) {
      setSelectedRoles((prev) =>
        prev.map((sel) => {
          const match = availableRoles.find((r) => String(r._id) === String(sel._id));
          return match ? match : sel;
        })
      );
    }
  }, [availableRoles]);

  const handleAddResource = () => {
    setResources((prev) => [...prev, { label: "", url: "" }]);
  };

  const handleUpdateResource = (index, field, value) => {
    setResources((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleRemoveResource = (index) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChosen = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      if (!newDocName.trim()) {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        setNewDocName(baseName);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!pendingFile) return;
    const docName = newDocName.trim() || pendingFile.name;
    setIsUploadingAttachment(true);
    try {
      const res = await uploadFile(pendingFile);
      const fileUrl =
        res?.data?.url || res?.url || res?.data?.file_url || res?.file_url;
      if (!fileUrl) {
        throw new Error("File URL not returned from server");
      }
      const newAttachment = {
        name: docName,
        file_url: fileUrl,
      };
      setAttachments((prev) => [...prev, newAttachment]);
      setPendingFile(null);
      setNewDocName("");
      toast.success(
        t("thesisManagement.modal.uploadSuccess", "Document added successfully")
      );
    } catch (err) {
      console.error("Failed to upload document", err);
      toast.error(
        err?.message ||
          t("thesisManagement.modal.uploadFailed", "Failed to upload file")
      );
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleUpdateDocName = (index, value) => {
    setAttachments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name: value } : item))
    );
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = t("thesisManagement.steps.form.nameRequired", "Step name is required");
    }

    resources.forEach((r, idx) => {
      if (r.label || r.url) {
        if (!r.label.trim()) {
          errs[`resource_label_${idx}`] = t(
            "thesisManagement.steps.form.resourceLabelRequired",
            "Label required"
          );
        }
        if (!r.url.trim()) {
          errs[`resource_url_${idx}`] = t(
            "thesisManagement.steps.form.resourceUrlRequired",
            "URL required"
          );
        } else if (!URL_PATTERN.test(r.url.trim())) {
          errs[`resource_url_${idx}`] = t(
            "thesisManagement.steps.form.invalidUrl",
            "Must start with http:// or https://"
          );
        }
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const validResources = resources
      .map((r) => ({ label: r.label.trim(), url: r.url.trim() }))
      .filter((r) => r.label && r.url);

    const validAttachments = attachments
      .map((a) => ({ name: a.name.trim(), file_url: a.file_url.trim() }))
      .filter((a) => a.name && a.file_url);

    const stepPayload = {
      ...(initialData?._id ? { _id: initialData._id } : {}),
      name: name.trim(),
      type,
      deadline_mode: deadlineMode,
      deadline_date: null,
      required,
      student_uploads_document: studentUploadsDocument,
      locked_until_supervisor: false,
      locked_until_step:
        lockedUntilStep && lockedUntilStep !== "NONE" ? lockedUntilStep : null,
      approval_roles:
        type === "teacher_approval" ? selectedRoles.map((r) => r._id) : [],
      instruction,
      resources: validResources,
      attachments: validAttachments,
      sequence: initialData?.sequence || 0,
    };

    onSave(stepPayload);
    onClose();
  };

  const deadlineOptions =
    type === "information_only"
      ? DEADLINE_MODES
      : DEADLINE_MODES.filter((m) => m.value !== "event_date");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? t("thesisManagement.steps.form.editTitle", "Edit Thesis Step")
              : t("thesisManagement.steps.form.addTitle", "Add Thesis Step")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Step Name */}
          <div className="space-y-1.5">
            <Label htmlFor="step-name">
              {t("thesisManagement.steps.form.name", "Step Name")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="step-name"
              placeholder={t(
                "thesisManagement.steps.form.namePlaceholder",
                "Enter step name"
              )}
              value={name}
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

          {/* Step Type */}
          <div className="space-y-1.5">
            <Label>
              {t("thesisManagement.steps.form.type", "Step Type")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(val) => {
                setType(val);
                if (val !== "information_only" && deadlineMode === "event_date") {
                  setDeadlineMode("none");
                }
                if (val === "document_upload" && !initialData) {
                  setStudentUploadsDocument(true);
                }
                // New info-only steps default off so they don't inflate progress
                if (!initialData && val === "information_only") {
                  setRequired(false);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STEP_TYPES.map((st) => (
                  <SelectItem key={st.value} value={st.value}>
                    {st.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teacher Select for teacher_approval */}
          {type === "teacher_approval" && (
            <SearchableMultiSelect
              label={t("thesisManagement.steps.form.teacherSelect", "Teacher Select")}
              placeholder={t(
                "thesisManagement.steps.form.selectTeacherRolesPlaceholder",
                "Select teacher roles..."
              )}
              searchPlaceholder={t(
                "thesisManagement.steps.form.searchRolesPlaceholder",
                "Search roles..."
              )}
              items={availableRoles}
              selected={selectedRoles}
              onChange={setSelectedRoles}
              isLoading={isRolesLoading}
            />
          )}

          {/* Deadlines Section */}
          <div className="bg-muted/30 border border-border/60 rounded-lg p-4">
            <div className="space-y-1.5">
              <Label>{t("thesisManagement.steps.form.deadlineMode", "Deadline Mode")}</Label>
              <Select
                value={deadlineMode}
                onValueChange={(val) => setDeadlineMode(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deadlineOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Workflow & Rules (all step types, including information_only) */}
          <div className="bg-muted/30 border border-border/60 rounded-lg p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("thesisManagement.steps.form.workflowRules", "Workflow & Rules")}
            </h4>

            <div className="space-y-3">
              {/* Required Flag */}
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="step-required" className="text-sm font-medium cursor-pointer">
                  {t("thesisManagement.steps.form.mandatoryStep", "Mandatory Step")}
                </Label>
                <Switch
                  id="step-required"
                  checked={required}
                  onCheckedChange={setRequired}
                />
              </div>

              {/* Student document upload (Only for document_upload) */}
              {type === "document_upload" && (
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                  <Label
                    htmlFor="step-student-upload"
                    className="text-sm font-medium cursor-pointer"
                  >
                    {t(
                      "thesisManagement.steps.form.studentUploads",
                      "Student Uploads Document"
                    )}
                  </Label>
                  <Switch
                    id="step-student-upload"
                    checked={studentUploadsDocument}
                    onCheckedChange={setStudentUploadsDocument}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Locked until prerequisite step (any step type) */}
          <div className="bg-muted/30 border border-border/60 rounded-lg p-4 space-y-1.5">
            <Label htmlFor="step-locked-until">
              {t(
                "thesisManagement.steps.form.lockedUntilStep",
                "Locked until this step is complete"
              )}
            </Label>
            <Select
              value={lockedUntilStep}
              onValueChange={setLockedUntilStep}
            >
              <SelectTrigger id="step-locked-until">
                <SelectValue
                  placeholder={t(
                    "thesisManagement.steps.form.lockedUntilNone",
                    "None"
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">
                  {t(
                    "thesisManagement.steps.form.lockedUntilNone",
                    "None"
                  )}
                </SelectItem>
                {lockOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t(
                "thesisManagement.steps.form.lockedUntilHint",
                "Student must complete the selected earlier step before this one unlocks."
              )}
            </p>
          </div>

          {/* Instructions Rich Text */}
          <div className="space-y-1.5">
            <Label>{t("thesisManagement.steps.form.instructions", "Instructions & Guidelines")}</Label>
            <RichTextEditor
              value={instruction}
              onChange={setInstruction}
              placeholder={t(
                "thesisManagement.steps.form.instructionsPlaceholder",
                "Provide step guidelines, formatting instructions, or requirements..."
              )}
            />
          </div>

          {/* Resources Dynamic Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {t("thesisManagement.steps.form.resources", "Resources & Links")}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddResource}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("thesisManagement.steps.form.addResource", "Add Link")}
              </Button>
            </div>

            {resources.length > 0 && (
              <div className="space-y-2 pt-1">
                {resources.map((res, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-muted/20 border border-border/50 rounded-lg"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <Input
                        placeholder={t("thesisManagement.steps.form.labelPlaceholder", "Resource label")}
                        value={res.label}
                        onChange={(e) =>
                          handleUpdateResource(idx, "label", e.target.value)
                        }
                        className={errors[`resource_label_${idx}`] ? "border-destructive" : ""}
                      />
                      {errors[`resource_label_${idx}`] && (
                        <p className="text-[11px] text-destructive mt-0.5">
                          {errors[`resource_label_${idx}`]}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 w-full sm:w-auto">
                      <Input
                        placeholder={t("thesisManagement.steps.form.urlPlaceholder", "https://example.com/template")}
                        value={res.url}
                        onChange={(e) =>
                          handleUpdateResource(idx, "url", e.target.value)
                        }
                        className={errors[`resource_url_${idx}`] ? "border-destructive" : ""}
                      />
                      {errors[`resource_url_${idx}`] && (
                        <p className="text-[11px] text-destructive mt-0.5">
                          {errors[`resource_url_${idx}`]}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveResource(idx)}
                      className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step Attachments (Documents) */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div>
              <Label className="text-sm font-medium">
                {t(
                  "thesisManagement.steps.form.attachmentsLabel",
                  "Step Files & Templates"
                )}
              </Label>
            </div>

            {/* Upload Control Box */}
            <div className="p-3 bg-muted/20 border border-border/60 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-foreground">
                    {t(
                      "thesisManagement.steps.form.docNameLabel",
                      "Document Name"
                    )}
                  </Label>
                  <Input
                    placeholder={t(
                      "thesisManagement.steps.form.docNamePlaceholder",
                      "e.g. Thesis Guidelines"
                    )}
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    disabled={isUploadingAttachment}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-foreground">
                    {t("thesisManagement.modal.selectFileLabel", "File")}
                  </Label>
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-between px-3 h-9 rounded-md border border-input bg-background hover:bg-muted text-xs cursor-pointer truncate">
                      <span className="truncate text-muted-foreground">
                        {pendingFile
                          ? pendingFile.name
                          : t(
                              "thesisManagement.steps.form.chooseFile",
                              "Choose file..."
                            )}
                      </span>
                      <Upload className="w-3.5 h-3.5 text-primary shrink-0 ml-1.5" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChosen}
                        disabled={isUploadingAttachment}
                      />
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddDocument}
                      disabled={!pendingFile || isUploadingAttachment}
                      className="h-9 px-3 shrink-0 cursor-pointer"
                    >
                      {isUploadingAttachment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t("common.add", "Add")
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
                {attachments.map((file, idx) => (
                  <div
                    key={file.file_url || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/60 hover:bg-muted/40 transition-colors gap-2"
                  >
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Input
                        value={file.name ?? ""}
                        onChange={(e) => handleUpdateDocName(idx, e.target.value)}
                        placeholder={t(
                          "thesisManagement.steps.form.docNameLabel",
                          "Document Name"
                        )}
                        className="h-8 text-xs sm:text-sm font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        title={t("common.view", "View")}
                        onClick={() => openSecureFile(file.file_url, file.name)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                        title={t("common.delete", "Delete")}
                        onClick={() => handleRemoveAttachment(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit">
              {initialData
                ? t("thesisManagement.steps.form.updateStep", "Update Step")
                : t("thesisManagement.steps.form.addStep", "Add Step to Draft")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StepForm;
