import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const [isUploading, setIsUploading] = useState(false);
  const [instructionContent, setInstructionContent] = useState("");
  const [moduleNameSearch, setModuleNameSearch] = useState("");
  const [showModuleSuggestions, setShowModuleSuggestions] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const debouncedModuleName = useDebounce(moduleNameSearch, 200);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      type: preselectedType || "",
      name: "",
      year: 1,
      amount: 0,
      module_number: 1,
      submission_deadline: "",
      instruction: "",
      instruction_video: "",
      resources: [],
      submissions: {
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

  const createComponent = useCreateComponent();
  const updateComponent = useUpdateComponent();
// console.log("programlanguageid",programLanguageId)
  // Search for existing modules when typing module name
  const { data: existingModulesData } = useGetComponents(
    {
      type: "module",
      search: debouncedModuleName,
      ...(programLanguageId && { language: programLanguageId }),
    },
    {
      enabled:
        selectedType === "module" && debouncedModuleName.length > 2 && !isEdit,
    },
  );

  // Fetch modules for this program (for exam type)
  const { data: programModulesData } = useGetComponents(
    {
      type: "module",
      program: programId,
    },
    {
      enabled: selectedType === "exam" && !!programId,
    },
  );
  const programModules = programModulesData?.data || [];

  // Fetch published exams (for exam type)
  const { data: publishedExamsData } = useGetExamsDropdown(
    { status: "published" },
    {
      enabled: selectedType === "exam",
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
    { value: "module", label: "Learning Module" },
    { value: "app", label: "Applied Professional Practice(APP)" },
    { value: "resource", label: "Research" },
    { value: "exam", label: "Exam Component" },
  ];

  const handleClose = () => {
    reset({
      type: preselectedType || "",
      name: "",
      year: 1,
      amount: 0,
      module_number: 1,
      submission_deadline: "",
      instruction: "",
      instruction_video: "",
      resources: [],
      submissions: {
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
    setModuleNameSearch("");
    setShowModuleSuggestions(false);
    setSelectedSystemId(null);
    lastLoadedId.current = null;
    onClose();
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
      module_number: componentData.module_number || 1,
      submission_deadline: formattedDeadline,
      instruction: componentData.instruction || "",
      instruction_video: componentData.instruction_video || "",
      resources: componentData.files
        ? componentData.files.map((file) => ({
            name: file.name,
            url: file.url,
            type: file.type || "file",
            file: null,
          }))
        : [],
      submissions: {
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

  const onSubmit = async (data) => {
    setIsUploading(true);

    try {
      const payload = {
        type: data.type,
        program: programId,
        status: data.status,
      };

      if (data.type !== "exam") {
        payload.name = data.name;
        payload.year = data.year;

        // Process resources: upload files in parallel using Promise.all
        const resources = data.resources || [];

        const processedFiles = await Promise.all(
          resources.map(async (resource) => {
            if (resource.type === "file" && resource.file) {
              // Upload new file
              try {
                const response = await uploadFile(resource.file);
                const fileUrl = response?.data?.file_url;

                if (!fileUrl) {
                  throw new Error(`Upload failed for ${resource.file.name}`);
                }

                return {
                  name: resource.name || resource.file.name.split(".")[0],
                  url: fileUrl,
                  type: "file",
                };
              } catch (error) {
                toast.error(`Failed to upload ${resource.file.name}`);
                throw error;
              }
            } else if (resource.url) {
              // Existing resource or manually entered link
              return {
                name:
                  resource.name ||
                  (resource.type === "file" ? "Existing File" : resource.url),
                url: resource.url,
                type: resource.type || "file",
              };
            }
            return null;
          }),
        );

        payload.files = processedFiles.filter(Boolean);
      }

      if (data.type === "module") {
        payload.amount = data.amount;
        payload.module_number = data.module_number;
        // Include system_id if a module was selected from suggestions
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

      mutation.mutate(args, {
        onSuccess: () => {
          setIsUploading(false);
          handleSuccessfulSubmit(data.type);
        },
        onError: (error) => {
          console.error("Save error:", error);
          setIsUploading(false);
          // toast.error(error?.message || "Failed to save component");
        },
      });
    } catch (error) {
      console.error("Submit error:", error);
      setIsUploading(false);
      toast.error(error?.message || "Failed to upload files");
    }
  };

  if (!open) return null;

  const isSubmitting =
    createComponent.isPending || updateComponent.isPending || isUploading;

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
                {isEdit ? "Edit Module" : "Create Module"}
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
              <Label>Module Type *</Label>
              <Select
                value={watchedType || ""}
                onValueChange={(v) => setValue("type", v)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module type" />
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
                <div className="space-y-2 relative">
                  <Label>
                    Module Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter module name"
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
                            <p className="font-medium text-sm">{module.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label>
                    In which year the module belongs{" "}
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
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Year {year}
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
                  label="Module Number"
                  type="number"
                  placeholder="Enter module number"
                  error={errors.module_number?.message}
                  required
                  {...register("module_number")}
                />
                <FormField
                  label="Amount"
                  type="number"
                  placeholder="Enter amount"
                  error={errors.amount?.message}
                  required
                  {...register("amount")}
                />
              </>
            )}
            {selectedType === "exam" && (
              <>
                <div className="space-y-2">
                  <Label>
                    Module{" "}
                    <span className="text-xs text-muted-foreground">
                      (Exam scheduled before this module)
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
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      {programModules.map((mod) => (
                        <SelectItem key={mod._id} value={mod._id}>
                          {mod.name}
                        </SelectItem>
                      ))}
                      {programModules.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          No modules found for this program
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
                    Exam <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    key={`linked_exam-${watch("linked_exam")}`}
                    value={watch("linked_exam") || ""}
                    onValueChange={(v) =>
                      setValue("linked_exam", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {publishedExams.map((exam) => (
                        <SelectItem key={exam._id} value={exam._id}>
                          {exam.name} ({exam.uid})
                        </SelectItem>
                      ))}
                      {publishedExams.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          No published exams available
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
                  label="Submission Deadline"
                  type="date"
                  placeholder="Select deadline"
                  error={errors.submission_deadline?.message}
                  required
                  {...register("submission_deadline")}
                />

                <div className="space-y-2">
                  <Label>
                    Instructions <span className="text-red-500">*</span>
                  </Label>
                  <RichTextEditor
                    value={instructionContent}
                    onChange={setInstructionContent}
                    placeholder="Enter instructions"
                    className={cn(errors.instruction && "border-destructive")}
                  />
                  {errors.instruction && (
                    <p className="text-sm text-destructive">
                      {errors.instruction.message}
                    </p>
                  )}
                </div>

                <FormField
                  label="Instruction Video URL"
                  type="url"
                  placeholder="Enter instruction video URL"
                  error={errors.instruction_video?.message}
                  required
                  {...register("instruction_video")}
                />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Submission Types
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="case_studies"
                        className="rounded border-gray-300"
                        {...register("submissions.case_studies")}
                      />
                      <Label htmlFor="case_studies" className="text-sm">
                        Case Studies
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
                        Essays
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
                        Internships
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
                setValue={setValue}
                append={append}
                remove={remove}
                fields={fields}
                errors={errors}
              />
            )}

            <div className="flex items-center justify-between">
              <Label>Active Status</Label>
              <Switch
                checked={watchedStatus}
                onCheckedChange={(v) => setValue("status", v)}
              />
            </div>

            <FormActions
              onCancel={handleClose}
              isLoading={isSubmitting}
              isEdit={isEdit}
              submitText={isUploading ? "Uploading files..." : undefined}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateComponent;
