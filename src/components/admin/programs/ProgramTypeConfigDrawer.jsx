import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import {
  GraduationCap,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useGetProgramTypeConfigs,
  useUpdateProgramTypeConfig,
} from "@/store/useProgramStore";
import DeleteConfirm from "@/components/DeleteConfirm";
import { slugifyPreviousEducationKey } from "@/utils/previousEducation";

const EMPTY_LABELS = { en: "", fr: "", nl: "", de: "" };

const LOCALE_FIELDS = [
  { code: "en", labelKey: "english", badge: "EN" },
  { code: "fr", labelKey: "french", badge: "FR" },
  { code: "nl", labelKey: "dutch", badge: "NL" },
  { code: "de", labelKey: "german", badge: "DE" },
];

const PROGRAM_TYPES = [
  "Master of Science",
  "Lateral Entry Master of Science",
  "Diploma",
  "Manual Therapie",
  "Post Academic Module",
];

const ProgramTypeConfigDrawer = ({ isOpen, onOpenChange }) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(PROGRAM_TYPES[0]);
  const [options, setOptions] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [formData, setFormData] = useState({
    key: "",
    labels: { ...EMPTY_LABELS },
    status: true,
  });

  const { data: configsRes, isLoading } = useGetProgramTypeConfigs({
    enabled: isOpen,
  });
  const updateMutation = useUpdateProgramTypeConfig();
  const isSaving = updateMutation.isPending;

  useEffect(() => {
    if (!isOpen || !configsRes?.data) return;
    const currentConfig = configsRes.data.find(
      (c) => c.program_type === selectedType
    );
    setOptions(currentConfig?.previous_education_options || []);
  }, [isOpen, configsRes, selectedType]);

  const resetForm = () => {
    setEditingIndex(null);
    setFormData({
      key: "",
      labels: { ...EMPTY_LABELS },
      status: true,
    });
  };

  const persistOptions = (nextOptions, onSuccess) => {
    updateMutation.mutate(
      {
        program_type: selectedType,
        previous_education_options: nextOptions.map((option, index) => ({
          ...option,
          sort_order: index,
        })),
      },
      {
        onSuccess: () => {
          setOptions(nextOptions);
          onSuccess?.();
        },
      }
    );
  };

  const handleOpenForm = (index = null) => {
    if (isSaving) return;

    if (index === null) {
      resetForm();
      setEditingIndex("new");
    } else {
      const option = options[index];
      setEditingIndex(index);
      setFormData({
        key: option.key,
        labels: { ...EMPTY_LABELS, ...option.labels },
        status: option.status !== false,
      });
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (isSaving) return;
    setFormOpen(false);
    resetForm();
  };

  const handleSaveOption = () => {
    const englishLabel = formData.labels.en?.trim();
    if (!englishLabel || isSaving) return;

    const key =
      editingIndex === "new"
        ? slugifyPreviousEducationKey(englishLabel)
        : formData.key;

    if (!key) return;

    const payload = {
      key,
      labels: {
        en: englishLabel,
        fr: formData.labels.fr?.trim() || "",
        nl: formData.labels.nl?.trim() || "",
        de: formData.labels.de?.trim() || "",
      },
      status: formData.status,
    };

    let nextOptions;
    if (editingIndex === "new") {
      if (options.some((option) => option.key === key)) return;
      nextOptions = [...options, payload];
    } else {
      nextOptions = options.map((option, index) =>
        index === editingIndex ? payload : option
      );
    }

    persistOptions(nextOptions, handleCloseForm);
  };

  const handleConfirmDelete = () => {
    if (deleteIndex === null || isSaving) return;

    const nextOptions = options.filter((_, i) => i !== deleteIndex);
    persistOptions(nextOptions, () => setDeleteIndex(null));
  };

  const isNewOption = editingIndex === "new";
  const deleteTarget =
    deleteIndex !== null
      ? options[deleteIndex]?.labels?.en || options[deleteIndex]?.key
      : "";

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[540px] p-0 bg-sidebar flex flex-col h-full max-h-screen"
        >
          <SheetHeader
            className="p-6 pb-5 shrink-0"
            style={{ borderBottom: "1px solid var(--sidebar-border, #e8edf3)" }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255,137,4,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <GraduationCap size={18} color="#ff8904" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base font-semibold text-sidebar-foreground">
                  {t("programDetail.previousEducation.typeTitle", "Program Type Defaults")}
                </SheetTitle>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#94a3b8" }}>
                  {t("programDetail.previousEducation.typeSubtitle", "Configure inherited options by program type")}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="p-6 pb-2 shrink-0">
            <Label className="text-xs font-semibold text-sidebar-foreground mb-1.5 block">
              {t("programManagement.table.type", "Program Type")}
            </Label>
            <Select
              value={selectedType}
              onValueChange={setSelectedType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("programManagement.modal.programTypePlaceholder", "Select program type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Master of Science">
                  {t("programManagement.modal.programTypes.masterOfScience", "Master of Science")}
                </SelectItem>
                <SelectItem value="Lateral Entry Master of Science">
                  {t("programManagement.modal.programTypes.lateralEntry", "Lateral Entry Master of Science")}
                </SelectItem>
                <SelectItem value="Diploma">
                  {t("programManagement.modal.programTypes.diploma", "Diploma")}
                </SelectItem>
                <SelectItem value="Manual Therapie">
                  {t("programManagement.modal.programTypes.manualTherapie", "Manual Therapie")}
                </SelectItem>
                <SelectItem value="Post Academic Module">
                  {t("programManagement.modal.programTypes.postAcademic", "Post Academic Module")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-4 pt-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="bg-sidebar rounded-xl border border-sidebar-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border bg-muted/30">
                  <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#94a3b8" }}
                  >
                    {t("programDetail.previousEducation.optionsList", "Options")}{" "}
                    <span className="text-sidebar-foreground">({options.length})</span>
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenForm(null)}
                    className="h-8 gap-1.5"
                    disabled={isSaving}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("programDetail.previousEducation.addOption")}
                  </Button>
                </div>

                {options.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div
                      className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: "rgba(255,137,4,0.10)" }}
                    >
                      <GraduationCap className="h-6 w-6 text-[#ff8904]" />
                    </div>
                    <p className="text-sm font-medium text-sidebar-foreground">
                      {t("programDetail.previousEducation.empty")}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-sidebar-border">
                    {options.map((option, index) => (
                      <li
                        key={option.key}
                        className="group flex items-start gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-sidebar-foreground truncate">
                              {option.labels?.en || option.key}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                option.status !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              }`}
                            >
                              {option.status !== false
                                ? t("programDetail.previousEducation.active")
                                : t("programDetail.previousEducation.inactive")}
                            </span>
                          </div>

                          <code className="inline-block text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {option.key}
                          </code>

                          <div className="flex flex-wrap gap-1.5">
                            {LOCALE_FIELDS.filter(({ code }) => code !== "en").map(
                              ({ code, badge }) =>
                                option.labels?.[code] ? (
                                  <span
                                    key={code}
                                    className="inline-flex items-center gap-1 rounded-md border border-sidebar-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground max-w-full"
                                  >
                                    <span className="font-semibold text-[10px] text-[#ff8904]">
                                      {badge}
                                    </span>
                                    <span className="truncate">{option.labels[code]}</span>
                                  </span>
                                ) : null
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenForm(index)}
                            disabled={isSaving}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteIndex(index)}
                            disabled={isSaving}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={formOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isNewOption
                ? t("programDetail.previousEducation.addOption", "Add Option")
                : t("programDetail.previousEducation.editOption", "Edit Option")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!isNewOption && (
              <div className="space-y-1">
                <Label className="text-xs">{t("programDetail.previousEducation.keyLabel")}</Label>
                <Input value={formData.key} disabled className="bg-muted text-muted-foreground" />
              </div>
            )}

            {LOCALE_FIELDS.map(({ code, labelKey, badge }) => (
              <div key={code} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    {t(`programDetail.previousEducation.locales.${labelKey}`)}{" "}
                    {code === "en" && <span className="text-destructive">*</span>}
                  </Label>
                  <span className="text-[10px] font-semibold text-muted-foreground px-1 bg-muted rounded">
                    {badge}
                  </span>
                </div>
                <Input
                  value={formData.labels[code]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      labels: { ...prev.labels, [code]: e.target.value },
                    }))
                  }
                  placeholder={t(`programDetail.previousEducation.placeholders.${labelKey}`)}
                  required={code === "en"}
                />
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-sidebar-border pt-4">
              <div className="space-y-0.5">
                <Label className="text-xs">{t("programDetail.previousEducation.active")}</Label>
                <p className="text-[10px] text-muted-foreground">
                  {t("programDetail.previousEducation.activeHint")}
                </p>
              </div>
              <Switch
                checked={formData.status}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, status: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleCloseForm} disabled={isSaving}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSaveOption}
              disabled={!formData.labels.en?.trim() || isSaving}
              className="gap-1.5"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={deleteIndex !== null}
        onOpenChange={(open) => !open && setDeleteIndex(null)}
        title={t("programDetail.previousEducation.deleteOptionConfirm", "Delete Option")}
        onConfirm={handleConfirmDelete}
        loading={isSaving}
      >
        <DialogDescription>
          {t("programDetail.previousEducation.deleteConfirmText", {
            name: deleteTarget,
          })}
        </DialogDescription>
      </DeleteConfirm>
    </>
  );
};

export default ProgramTypeConfigDrawer;
