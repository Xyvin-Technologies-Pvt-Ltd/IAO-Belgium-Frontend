import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  X,
  FileText,
  Cloud,
  Link,
  Loader2,
  Plus,
  Trash,
  ExternalLink,
  Pencil,
  Check,
} from "lucide-react";
import { formatTZ } from "@/utils/dateUtils";
import moment from "moment";
import { uploadFile } from "@/api/uploadApi";

import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { cn } from "@/lib/utils";

import {
  useCreateComponent,
  useUpdateComponent,
} from "@/store/useComponentStore";
import { useGetComponents } from "@/store/useDropdownStore";
import { useGetExamsDropdown } from "@/store/useExamStore";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { componentSchema } from "@/validations/admin";
import { useDebounce } from "@/hooks/useDebounce";
import ResourceSection from "./resources/ResourceSection";
import { useGetProgramById } from "@/store/useProgramStore";

const CreateComponent = ({
  open,
  onClose,
  componentData,
  programId,
  programLanguageId,
  preselectedType,
  onComponentCreated,
}) => {
  const { t } = useTranslation();
  const isEdit = !!componentData;

  const [selectedType, setSelectedType] = useState("");
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState({});
  const [instructionContent, setInstructionContent] = useState("");
  const [additionalContextContent, setAdditionalContextContent] = useState("");
  const [moduleNameSearch, setModuleNameSearch] = useState("");
  const [showModuleSuggestions, setShowModuleSuggestions] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const debouncedModuleName = useDebounce(moduleNameSearch, 200);

  const { data: programRes } = useGetProgramById(programId, { enabled: !!programId && open });
  const program = programRes?.data;
  const totalStages = program?.year || 1;
  const stageOptions = Array.from({ length: totalStages }, (_, i) => i + 1);

  const durationUnit = program?.duration_unit || "years";
  const singularUnitKey = durationUnit.endsWith("s") ? durationUnit.slice(0, -1) : durationUnit;
  const unitLabel = t(`common.durationUnits.${singularUnitKey}`, singularUnitKey);
  const capitalizedUnitLabel = unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      type: preselectedType || "",
      name: "",
      year: 1,
      amount: 0,
      is_free: false,
      module_number: 1,
      submission_deadline: "",
      instruction: "",
      instruction_video: "",
      additional_context: "",
      resources: [],
      submissions: {
        onboarding: false,
        scientific_research_intro: false,
        peer_groups: false,
        case_studies: false,
        essays: false,
        internships: false,
      },
      status: true,
      linked_module: "",
      linked_exam: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "resources",
  });

  const watchedType = watch("type");
  const watchedStatus = watch("status");
  const isFree = watch("is_free");

  const createComponent = useCreateComponent();
  const updateComponent = useUpdateComponent();
  const { data: existingModulesData } = useGetComponents(
    {
      type: "module",
      search: debouncedModuleName,
      ...(programLanguageId && { language: programLanguageId }),
    },
    {
      enabled:
        open && selectedType === "module" && debouncedModuleName.length > 2 && !isEdit,
    },
  );

  // Fetch modules for this program (for exam type)
  const { data: programModulesData } = useGetComponents(
    {
      type: "module",
      program: programId,
    },
    {
      enabled: open && selectedType === "exam" && !!programId,
    },
  );
  const programModules = programModulesData?.data || [];

  // Fetch published exams (for exam type)
  const { data: publishedExamsData } = useGetExamsDropdown(
    {
      status: "published",
      type: "online",
      ...(programLanguageId && { exam_language: programLanguageId }),
    },
    {
      enabled: open && selectedType === "exam",
    },
  );
  const publishedExams = publishedExamsData?.data || [];

  // Filter modules to show only unique system_ids (or modules without system_id)
  // Group by system_id and take the first one from each group
  const existingModules = (() => {
    const modules = existingModulesData?.data || [];
    const seenSystemIds = new Set();
    const uniqueModules = [];

    for (const module of modules) {
      if (module.system_id) {
        // If module has system_id, only add if we haven't seen this system_id before
        if (!seenSystemIds.has(module.system_id)) {
          seenSystemIds.add(module.system_id);
          uniqueModules.push(module);
        }
      } else {
        // If module doesn't have system_id, always add it
        uniqueModules.push(module);
      }
    }

    return uniqueModules; // Limit to 5 results
  })();

  const componentTypes = [
    { value: "module", label: t("componentManagement.types.module") },
    { value: "app", label: t("componentManagement.types.app") },
    { value: "resource", label: t("componentManagement.types.resource") },
    { value: "exam", label: t("componentManagement.types.exam") },
  ];

  const handleClose = () => {
    reset({
      type: preselectedType || "",
      name: "",
      year: 1,
      amount: 0,
      is_free: false,
      module_number: 1,
      submission_deadline: "",
      instruction: "",
      instruction_video: "",
      additional_context: "",
      resources: [],
      submissions: {
        onboarding: false,
        scientific_research_intro: false,
        peer_groups: false,
        case_studies: false,
        essays: false,
        internships: false,
      },
      status: true,
      linked_module: "",
      linked_exam: "",
    });
    setSelectedType(preselectedType || "");
    setInstructionContent("");
    setAdditionalContextContent("");
    setModuleNameSearch("");
    setShowModuleSuggestions(false);
    setSelectedSystemId(null);
    setFileUploadProgress({});
    setIsUploadingFiles(false);
    lastLoadedId.current = null;
    onClose();
  };

  const mapResourcesToPayloadFiles = (resources = []) =>
    resources
      .map((resource) => {
        if (resource.type === "file" && resource.url) {
          return {
            name: resource.name || resource.url.split("/").pop(),
            url: resource.url,
            type: "file",
          };
        }

        if (resource.type === "link" && resource.url) {
          return {
            name: resource.name || resource.url,
            url: resource.url,
            type: "link",
          };
        }

        return null;
      })
      .filter(Boolean);

  const uploadResourceFile = async (fieldId, index, file) => {
    setFileUploadProgress((prev) => ({
      ...prev,
      [fieldId]: {
        progress: 0,
        status: "uploading",
        fileName: file.name,
        fileSize: file.size,
      },
    }));

    const response = await uploadFile(file, (event) => {
      const phase = event.phase || "uploading";
      setFileUploadProgress((prev) => ({
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          progress: event.percent ?? 0,
          phase,
          status: phase === "complete" ? "complete" : phase,
          fileName: file.name,
          fileSize: file.size,
        },
      }));
    });

    const fileUrl = response?.data?.file_url;
    if (!fileUrl) {
      throw new Error(`Upload failed for ${file.name}`);
    }

    setValue(
      `resources.${index}`,
      {
        type: "file",
        name: file.name.split(".")[0],
        url: fileUrl,
        file: null,
      },
      { shouldValidate: true },
    );

    setFileUploadProgress((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        progress: 100,
        status: "complete",
        fileName: file.name,
        fileSize: file.size,
      },
    }));
  };

  const handleRetryUpload = async (fieldId, index) => {
    const resource = getValues(`resources.${index}`);
    if (!resource?.file) return;

    setIsUploadingFiles(true);
    try {
      await uploadResourceFile(fieldId, index, resource.file);
    } catch (error) {
      setFileUploadProgress((prev) => ({
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          status: "error",
        },
      }));
      toast.error(
        error?.message ||
          t("resourceModule.resources.uploadFailed", {
            name: resource.file.name,
            defaultValue: `Failed to upload ${resource.file.name}`,
          }),
      );
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleSuccessfulSubmit = (componentType) => {
    handleClose();
    if (onComponentCreated) {
      onComponentCreated(componentType);
    }
  };

  const lastLoadedId = useRef(null);

  useEffect(() => {
    if (!componentData || !open) return;

    if (lastLoadedId.current === componentData._id) return;
    lastLoadedId.current = componentData._id;

    const componentType = componentData.type || "";

    const formattedDeadline = componentData.submission_deadline
      ? formatTZ(componentData.submission_deadline, "YYYY-MM-DD")
      : "";

    // Handle submissions object format
    const submissions = componentData.submissions || {};

    const formData = {
      type: componentType,
      name: componentData.name || "",
      year: Number(componentData.year) || 1,
      amount: componentData.amount || 0,
      is_free: componentData.amount === 0,
      module_number: componentData.module_number || 1,
      submission_deadline: formattedDeadline,
      instruction: componentData.instruction || "",
      instruction_video: componentData.instruction_video || "",
      additional_context: componentData.additional_context || "",
      resources: componentData.files
        ? componentData.files.map((file) => ({
            name: file.name,
            url: file.url,
            type: file.type || "file",
            file: null,
          }))
        : [],
      submissions: {
        onboarding: submissions.onboarding || false,
        scientific_research_intro: submissions.scientific_research_intro || false,
        peer_groups: submissions.peer_groups || false,
        case_studies: submissions.case_studies || false,
        essays: submissions.essays || false,
        internships: submissions.internships || false,
      },
      status: componentData.status ?? true,
      linked_module:
        componentData.linked_module?._id || componentData.linked_module || "",
      linked_exam:
        componentData.linked_exam?._id || componentData.linked_exam || "",
    };

    // Reset form and set type state together
    reset(formData);
    setSelectedType(componentType);
    setValue("type", componentType);

    // Set instruction content separately to ensure RichTextEditor updates
    const instructionText = componentData.instruction || "";
    setInstructionContent(instructionText);
    setValue("instruction", instructionText);

    // Set additional context content separately to ensure RichTextEditor updates
    const additionalContextText = componentData.additional_context || "";
    setAdditionalContextContent(additionalContextText);
    setValue("additional_context", additionalContextText);
  }, [componentData, open, reset, setValue]);

  useEffect(() => {
    setSelectedType(watchedType);
  }, [watchedType]);

  useEffect(() => {
    if (preselectedType && !isEdit) {
      setValue("type", preselectedType);
      setSelectedType(preselectedType);
    }
  }, [preselectedType, isEdit, setValue]);

  // Sync instruction content with form validation
  useEffect(() => {
    setValue("instruction", instructionContent);
  }, [instructionContent, setValue]);

  // Sync additional context content with form validation
  useEffect(() => {
    setValue("additional_context", additionalContextContent);
  }, [additionalContextContent, setValue]);

  useEffect(() => {
    if (isFree) {
      setValue("amount", 0, { shouldValidate: true });
    }
  }, [isFree, setValue]);

  const onSubmit = async (data) => {
    setIsUploadingFiles(true);

    try {
      const resources = data.resources || [];

      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        const fieldId = fields[i]?.id;

        if (
          resource.type === "file" &&
          resource.file &&
          !resource.url &&
          fieldId
        ) {
          try {
            await uploadResourceFile(fieldId, i, resource.file);
          } catch (error) {
            setFileUploadProgress((prev) => ({
              ...prev,
              [fieldId]: {
                ...prev[fieldId],
                status: "error",
              },
            }));
            toast.error(
              error?.message ||
                t("resourceModule.resources.uploadFailed", {
                  name: resource.file.name,
                  defaultValue: `Failed to upload ${resource.file.name}`,
                }),
            );
            return;
          }
        }
      }

      const updatedResources = getValues("resources") || [];
      const payload = {
        type: data.type,
        program: programId,
        status: data.status,
      };

      if (data.type !== "exam") {
        payload.name = data.type === "app" ? "APP" : data.name;
        payload.year = data.year;
        payload.files = mapResourcesToPayloadFiles(updatedResources);
      }

      if (data.type === "module") {
        payload.amount = data.is_free ? 0 : Number(data.amount);
        payload.module_number = data.module_number;
        payload.additional_context = additionalContextContent.trim();
        if (selectedSystemId) {
          payload.system_id = selectedSystemId;
        }
      }

      if (data.type === "app") {
        payload.submission_deadline = data.submission_deadline;
        payload.instruction = instructionContent.trim();
        payload.instruction_video = data.instruction_video;
        payload.submissions = data.submissions;
      }

      if (data.type === "exam") {
        payload.linked_module = data.linked_module;
        payload.linked_exam = data.linked_exam;
      }

      const mutation = isEdit ? updateComponent : createComponent;
      const args = isEdit ? { id: componentData._id, data: payload } : payload;

      await mutation.mutateAsync(args);
      handleSuccessfulSubmit(data.type);
    } catch (error) {
      console.error("Submit error:", error);
      if (!error?.message?.includes("Upload failed")) {
        // toast.error(error?.message || "Failed to save component");
      }
    } finally {
      setIsUploadingFiles(false);
    }
  };

  if (!open) return null;

  const isSubmitting =
    createComponent.isPending ||
    updateComponent.isPending ||
    isUploadingFiles;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowModuleSuggestions(false);
        }
      }}
    >
      <div
        className="bg-white dark:bg-black border rounded-xl shadow-lg w-xl max-h-[90vh] flex flex-col"
        onClick={() => setShowModuleSuggestions(false)}
      >
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit
                  ? t("componentManagement.editTitle")
                  : t("componentManagement.createTitle")}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>{t("componentManagement.typeLabel")} *</Label>
              <Select
                value={watchedType || ""}
                onValueChange={(v) => setValue("type", v)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("componentManagement.typePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {componentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>
            {selectedType !== "exam" && (
              <>
                {selectedType !== "app" && (
                  <div className="space-y-2 relative">
                    <Label>
                      {t("componentManagement.nameLabel")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t("componentManagement.namePlaceholder")}
                      {...register("name")}
                      onChange={(e) => {
                        register("name").onChange(e);
                        if (selectedType === "module" && !isEdit) {
                          setModuleNameSearch(e.target.value);
                          setShowModuleSuggestions(true);
                          // Clear selected system_id when user types manually
                          setSelectedSystemId(null);
                        }
                      }}
                      onFocus={() => {
                        if (
                          selectedType === "module" &&
                          !isEdit &&
                          moduleNameSearch
                        ) {
                          setShowModuleSuggestions(true);
                        }
                      }}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}

                    {/* Module suggestions dropdown */}
                    {selectedType === "module" &&
                      !isEdit &&
                      showModuleSuggestions &&
                      moduleNameSearch.length > 2 &&
                      existingModules.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-y-auto">
                          {existingModules.map((module) => (
                            <div
                              key={module._id}
                              className="p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b last:border-b-0"
                              onClick={() => {
                                setValue("name", module.name);
                                setModuleNameSearch(module.name);
                                setSelectedSystemId(module.system_id || null);
                                setShowModuleSuggestions(false);
                              }}
                            >
                              <p className="font-medium text-sm">
                                {module.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    {capitalizedUnitLabel}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    key={`year-${watch("year")}`}
                    value={watch("year")?.toString() || ""}
                    onValueChange={(v) =>
                      setValue("year", parseInt(v), { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("componentManagement.selectUnitPlaceholder", {
                          defaultValue: `Select ${unitLabel}`,
                          unit: unitLabel,
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {stageOptions.map((stage) => (
                        <SelectItem key={stage} value={stage.toString()}>
                          {`${capitalizedUnitLabel} ${stage}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.year && (
                    <p className="text-sm text-destructive">
                      {errors.year.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {selectedType === "module" && (
              <>
                <FormField
                  label={t("componentManagement.moduleNumberLabel")}
                  type="number"
                  placeholder={t("componentManagement.moduleNumberPlaceholder")}
                  error={errors.module_number?.message}
                  required
                  {...register("module_number")}
                />
                <div className="flex items-center space-x-3 bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-lg border dark:border-white/10">
                  <Controller
                    name="is_free"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="is_free"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <div className="flex flex-col">
                    <Label htmlFor="is_free" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                      {t("componentManagement.freeComponentLabel", "Free Module")}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {t("componentManagement.freeComponentDescription", "Enable if this module does not require any additional payment")}
                    </span>
                  </div>
                </div>

                {!isFree && (
                  <FormField
                    label={t("componentManagement.amountLabel")}
                    type="number"
                    placeholder={t("componentManagement.amountPlaceholder")}
                    error={errors.amount?.message}
                    required
                    {...register("amount")}
                  />
                )}
                <div className="space-y-2">
                  <Label>
                    {t("componentManagement.additionalContextLabel", "Additional Context")}
                  </Label>
                  <RichTextEditor
                    value={additionalContextContent}
                    onChange={setAdditionalContextContent}
                    placeholder={t(
                      "componentManagement.additionalContextPlaceholder",
                      "Enter additional context for the module..."
                    )}
                    className={cn(errors.additional_context && "border-destructive")}
                  />
                  {errors.additional_context && (
                    <p className="text-sm text-destructive">
                      {errors.additional_context.message}
                    </p>
                  )}
                </div>
              </>
            )}
            {selectedType === "exam" && (
              <>
                <div className="space-y-2">
                  <Label>
                    {t("componentManagement.linkedModuleLabel")}{" "}
                    <span className="text-xs text-muted-foreground">
                      {t("componentManagement.linkedModuleHint")}
                    </span>{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    key={`linked_module-${watch("linked_module")}`}
                    value={watch("linked_module") || ""}
                    onValueChange={(v) =>
                      setValue("linked_module", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "componentManagement.linkedModulePlaceholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {programModules.map((mod) => (
                        <SelectItem key={mod._id} value={mod._id}>
                          {mod.name}
                        </SelectItem>
                      ))}
                      {programModules.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          {t("componentManagement.noModulesFound")}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.linked_module && (
                    <p className="text-sm text-destructive">
                      {errors.linked_module.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    {t("componentManagement.linkedExamLabel")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    key={`linked_exam-${watch("linked_exam")}`}
                    value={watch("linked_exam") || ""}
                    onValueChange={(v) =>
                      setValue("linked_exam", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "componentManagement.linkedExamPlaceholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {publishedExams.map((exam) => (
                        <SelectItem key={exam._id} value={exam._id}>
                          {exam.name} ({exam.uid})
                        </SelectItem>
                      ))}
                      {publishedExams.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          {t("componentManagement.noPublishedExams")}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.linked_exam && (
                    <p className="text-sm text-destructive">
                      {errors.linked_exam.message}
                    </p>
                  )}
                </div>
              </>
            )}
            {selectedType === "app" && (
              <>
                <FormField
                  label={t("componentManagement.submissionDeadlineLabel")}
                  type="date"
                  placeholder={t(
                    "componentManagement.submissionDeadlinePlaceholder",
                  )}
                  error={errors.submission_deadline?.message}
                  required
                  {...register("submission_deadline")}
                />

                <div className="space-y-2">
                  <Label>
                    {t("componentManagement.instructionsLabel")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <RichTextEditor
                    value={instructionContent}
                    onChange={setInstructionContent}
                    placeholder={t(
                      "componentManagement.instructionsPlaceholder",
                    )}
                    className={cn(errors.instruction && "border-destructive")}
                  />
                  {errors.instruction && (
                    <p className="text-sm text-destructive">
                      {errors.instruction.message}
                    </p>
                  )}
                </div>

                <FormField
                  label={t("componentManagement.instructionVideoLabel")}
                  type="url"
                  placeholder={t(
                    "componentManagement.instructionVideoPlaceholder",
                  )}
                  error={errors.instruction_video?.message}
                  required
                  {...register("instruction_video")}
                />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {t("componentManagement.submissionTypesLabel")}
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="onboarding"
                        className="rounded border-gray-300"
                        {...register("submissions.onboarding")}
                      />
                      <Label htmlFor="onboarding" className="text-sm">
                        {t("componentManagement.onboarding")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="scientific_research_intro"
                        className="rounded border-gray-300"
                        {...register("submissions.scientific_research_intro")}
                      />
                      <Label htmlFor="scientific_research_intro" className="text-sm">
                        {t("componentManagement.scientificResearchIntro")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="peer_groups"
                        className="rounded border-gray-300"
                        {...register("submissions.peer_groups")}
                      />
                      <Label htmlFor="peer_groups" className="text-sm">
                        {t("componentManagement.peerGroups")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="internships"
                        className="rounded border-gray-300"
                        {...register("submissions.internships")}
                      />
                      <Label htmlFor="internships" className="text-sm">
                        {t("componentManagement.internships")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="essays"
                        className="rounded border-gray-300"
                        {...register("submissions.essays")}
                      />
                      <Label htmlFor="essays" className="text-sm">
                        {t("componentManagement.essays")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="case_studies"
                        className="rounded border-gray-300"
                        {...register("submissions.case_studies")}
                      />
                      <Label htmlFor="case_studies" className="text-sm">
                        {t("componentManagement.caseStudies")}
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedType !== "exam" && (
              <ResourceSection
                control={control}
                register={register}
                append={append}
                remove={remove}
                fields={fields}
                errors={errors}
                uploadProgress={fileUploadProgress}
                onRetryUpload={handleRetryUpload}
              />
            )}

            <div className="flex items-center justify-between">
              <Label>{t("componentManagement.activeStatus")}</Label>
              <Switch
                checked={watchedStatus}
                onCheckedChange={(v) => setValue("status", v)}
              />
            </div>

            <FormActions
              onCancel={handleClose}
              isLoading={isSubmitting}
              isEdit={isEdit}
              submitText={
                isUploadingFiles
                  ? t("componentManagement.uploadingFiles")
                  : undefined
              }
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateComponent;
