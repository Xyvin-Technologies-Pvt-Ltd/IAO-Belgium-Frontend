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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { Plus, Trash2, Link as LinkIcon, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import moment from "moment";

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

const StepForm = ({ open, onClose, onSave, initialData }) => {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [type, setType] = useState("document_upload");
  const [deadlineMode, setDeadlineMode] = useState("none");
  const [required, setRequired] = useState(true);
  const [studentUploadsDocument, setStudentUploadsDocument] = useState(true);
  const [lockedUntilSupervisor, setLockedUntilSupervisor] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [resources, setResources] = useState([]);
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
      setLockedUntilSupervisor(Boolean(initialData.locked_until_supervisor));
      setInstruction(initialData.instruction || "");
      setResources(
        Array.isArray(initialData.resources) && initialData.resources.length > 0
          ? initialData.resources.map((r) => ({
              label: r.label || "",
              url: r.url || "",
            }))
          : []
      );
    } else {
      setName("");
      setType("document_upload");
      setDeadlineMode("none");
      setRequired(true);
      setStudentUploadsDocument(true);
      setLockedUntilSupervisor(false);
      setInstruction("");
      setResources([]);
    }
    setErrors({});
  }, [initialData, open]);

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

    const stepPayload = {
      ...(initialData?._id ? { _id: initialData._id } : {}),
      name: name.trim(),
      type,
      deadline_mode: deadlineMode,
      deadline_date: null,
      required,
      student_uploads_document: studentUploadsDocument,
      locked_until_supervisor: lockedUntilSupervisor,
      instruction,
      resources: validResources,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Conditional Type Flags & Switches */}
          {type !== "information_only" && (
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

                {/* Locked until supervisor */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                  <Label
                    htmlFor="step-locked-supervisor"
                    className="text-sm font-medium cursor-pointer"
                  >
                    {t(
                      "thesisManagement.steps.form.lockedSupervisor",
                      "Locked Until Supervisor Approves"
                    )}
                  </Label>
                  <Switch
                    id="step-locked-supervisor"
                    checked={lockedUntilSupervisor}
                    onCheckedChange={setLockedUntilSupervisor}
                  />
                </div>
              </div>
            </div>
          )}

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
