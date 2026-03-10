import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X, FileText, Cloud, Link, Loader2, Plus, Trash } from "lucide-react";
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
  useGetComponents,
} from "@/store/useComponentStore";
import { useGetExamsDropdown } from "@/store/useExamStore";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { componentSchema } from "@/validations/admin";
import { useDebounce } from "@/hooks/useDebounce";

const CreateComponent = ({
  open,
  onClose,
  componentData,
  programId,
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

  // Search for existing modules when typing module name
  const { data: existingModulesData } = useGetComponents(
    {
      type: "module",
      search: debouncedModuleName,
      limit: 10,
    },
    {
      enabled: selectedType === "module" && debouncedModuleName.length > 2 && !isEdit,
    }
  );

  // Fetch modules for this program (for exam type)
  const { data: programModulesData } = useGetComponents(
    {
      type: "module",
      program: programId,
      limit: 100,
    },
    {
      enabled: selectedType === "exam" && !!programId,
    }
  );
  const programModules = programModulesData?.data || [];

  // Fetch published exams (for exam type)
  const { data: publishedExamsData } = useGetExamsDropdown(
    { status: "published" },
    {
      enabled: selectedType === "exam",
    }
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
    onClose();
  };

  const handleSuccessfulSubmit = (componentType) => {
    handleClose();
    if (onComponentCreated) {
      onComponentCreated(componentType);
    }
  };

  const addResource = () => {
    const newResource = {
      type: "link",
      name: "",
      url: "",
      file: null,
    };
    append(newResource);
  };

  const removeResource = (index) => {
    remove(index);
  };

  useEffect(() => {
    if (!componentData || !open) return;

    const componentType = componentData.type || "";

    const formattedDeadline = componentData.submission_deadline
      ? moment(componentData.submission_deadline).format("YYYY-MM-DD")
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
            type: "link",
            name: file.name,
            url: file.url,
            file: null,
          }))
        : [],
      submissions: {
        case_studies: submissions.case_studies || false,
        essays: submissions.essays || false,
        internships: submissions.internships || false,
      },
      status: componentData.status ?? true,
      linked_module: componentData.linked_module?._id || componentData.linked_module || "",
      linked_exam: componentData.linked_exam?._id || componentData.linked_exam || "",
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

        // Process resources: upload files and collect all URLs
        const processedFiles = [];
        const resources = data.resources || [];
        
        
        for (let i = 0; i < resources.length; i++) {
          const resource = resources[i];
          
          if (resource.type === "file" && resource.file) {
            // Upload file
            try {
              const response = await uploadFile(resource.file);
              const fileUrl = response?.data?.file_url || null;
              
              if (!fileUrl) {
                throw new Error("No file URL returned from upload");
              }
              
              processedFiles.push({
                name: resource.name || resource.file.name.split(".")[0],
                url: fileUrl,
              });
            } catch (uploadError) {
              console.error("File upload error:", uploadError);
              toast.error(`Failed to upload ${resource.file.name}: ${uploadError.message}`);
              throw uploadError;
            }
          } else if (resource.type === "link" && resource.url) {
            // Use existing URL
            processedFiles.push({
              name: resource.name || (() => {
                try {
                  const url = new URL(resource.url);
                  const pathname = url.pathname;
                  const filename = pathname.split('/').pop() || url.hostname;
                  return filename.split('.')[0] || url.hostname;
                } catch {
                  return resource.url.length > 30 ? resource.url.substring(0, 30) + '...' : resource.url;
                }
              })(),
              url: resource.url,
            });
          }
        }
        payload.files = processedFiles;
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
          toast.error(error?.message || "Failed to save component");
        },
      });
    } catch (error) {
      console.error("Submit error:", error);
      setIsUploading(false);
      toast.error(error?.message || "Failed to upload files");
    }
  };

  if (!open) return null;

  const isSubmitting = createComponent.isPending || updateComponent.isPending || isUploading;

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
        className="bg-white dark:bg-black border rounded-xl shadow-lg w-xl max-h-[90vh] overflow-y-auto p-6"
        onClick={() => setShowModuleSuggestions(false)}
      >
        <h2 className="text-xl font-bold">
          {isEdit ? "Edit Module" : "Create Module"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
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
              <p className="text-sm text-destructive">{errors.type.message}</p>
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
                    if (selectedType === "module" && !isEdit && moduleNameSearch) {
                      setShowModuleSuggestions(true);
                    }
                  }}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
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
                <Label>In which year the module belongs <span className="text-red-500">*</span></Label>
                <Select
                  key={`year-${watch("year")}`}
                  value={watch("year")?.toString() || ""}
                  onValueChange={(v) => setValue("year", parseInt(v), { shouldValidate: true })}
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
                  <p className="text-sm text-destructive">{errors.year.message}</p>
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
                  Module <span className="text-xs text-muted-foreground">(Exam scheduled before this module)</span> <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch("linked_module") || ""}
                  onValueChange={(v) => setValue("linked_module", v, { shouldValidate: true })}
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
                  <p className="text-sm text-destructive">{errors.linked_module.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Exam <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch("linked_exam") || ""}
                  onValueChange={(v) => setValue("linked_exam", v, { shouldValidate: true })}
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
                  <p className="text-sm text-destructive">{errors.linked_exam.message}</p>
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
                <Label>Instructions <span className="text-red-500">*</span></Label>
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
                <Label className="text-sm font-medium">Submission Types</Label>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Resources</Label>
              </div>

              {fields.length === 0 && (
                <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No resources added yet. Click "Add Resource" to add files or links.
                  </p>
                </div>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Resource {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResource(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Resource Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={watch(`resources.${index}.type`) || "link"}
                        onValueChange={(v) => {
                          setValue(`resources.${index}.type`, v);
                          // Clear file/url when switching types
                          if (v === "link") {
                            setValue(`resources.${index}.file`, null);
                          } else {
                            setValue(`resources.${index}.url`, "");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select resource type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="link">URL</SelectItem>
                          <SelectItem value="file">File</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Resource Name
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter resource name (optional)"
                        {...register(`resources.${index}.name`)}
                      />
                      {errors.resources?.[index]?.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.resources[index].name.message}
                        </p>
                      )}
                    </div>

                    {watch(`resources.${index}.type`) === "link" ? (
                      <div>
                        <Label className="text-sm font-medium">
                          URL <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="url"
                          placeholder="Enter URL"
                          {...register(`resources.${index}.url`)}
                        />
                        {errors.resources?.[index]?.url && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.resources[index].url.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Label className="text-sm font-medium">
                          Upload File <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="file"
                            id={`file-upload-${index}`}
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setValue(`resources.${index}.file`, file, { shouldValidate: true });
                                // Auto-fill name if empty
                                if (!watch(`resources.${index}.name`)) {
                                  setValue(
                                    `resources.${index}.name`,
                                    file.name.split(".")[0],
                                    { shouldValidate: true }
                                  );
                                }
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`file-upload-${index}`}
                            className={cn(
                              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-[6px] border-[0.5px] px-3 py-1 text-base transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                              "bg-white dark:text-white cursor-pointer",
                              "flex items-center justify-between",
                              watch(`resources.${index}.file`) && "text-foreground"
                            )}
                          >
                            <span className={cn(
                              "flex items-center gap-2 text-sm",
                              !watch(`resources.${index}.file`) && "text-muted-foreground"
                            )}>
                              <Cloud className="h-4 w-4" />
                              {watch(`resources.${index}.file`)
                                ? watch(`resources.${index}.file`).name
                                : "Choose file"}
                            </span>
                            {watch(`resources.${index}.file`) && (
                              <span className="text-xs text-muted-foreground">
                                {(watch(`resources.${index}.file`).size / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </label>
                        </div>
                        {errors.resources?.[index]?.file && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.resources[index].file.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={addResource}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Resource
                </Button>
              </div>
            </div>
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
  );
};

export default CreateComponent;
