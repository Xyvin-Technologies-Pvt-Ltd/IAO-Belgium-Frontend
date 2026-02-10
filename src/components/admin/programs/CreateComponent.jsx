import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X, FileText, Cloud, Link } from "lucide-react";
import moment from "moment";

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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { componentSchema } from "@/validations/admin";

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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [resourceType, setResourceType] = useState("file"); // "file" or "link"
  const [instructionContent, setInstructionContent] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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
      files: [],
      submissions: {
        case_studies: false,
        essays: false,
        internships: false,
      },
      status: true,
      resource_name: "",
      resource_url: "",
    },
  });

  const watchedType = watch("type");
  const watchedStatus = watch("status");

  const createComponent = useCreateComponent();
  const updateComponent = useUpdateComponent();

  const componentTypes = [
    { value: "module", label: "Learning Module" },
    { value: "app", label: "Applied Professional Practice(APP)" },
    { value: "resource", label: "Research" },
    // { value: "exam", label: "Exam Component" },
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
      files: [],
      submissions: {
        case_studies: false,
        essays: false,
        internships: false,
      },
      status: true,
      resource_name: "",
      resource_url: "",
    });
    setSelectedType(preselectedType || "");
    setUploadedFiles([]);
    setResourceType("file");
    setInstructionContent("");
    onClose();
  };

  const handleSuccessfulSubmit = (componentType) => {
    handleClose();
    if (onComponentCreated) {
      onComponentCreated(componentType);
    }
  };
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const resourceName = watch("resource_name");

    const newFiles = files.map((file) => ({
      file,
      name: resourceName || file.name.split('.')[0], // Use file name without extension if no resource name provided
      originalFileName: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      url: `https://example.com/uploads/${Date.now()}_${file.name}`, // mock url
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    setValue(
      "files",
      [...uploadedFiles, ...newFiles].map((f) => ({
        name: f.name,
        url: f.url,
      })),
    );

    setValue("resource_name", "");
    // Clear the file input after successful upload
    event.target.value = "";
  };

  const addLinkResource = () => {
    const resourceName = watch("resource_name");
    const resourceUrl = watch("resource_url");

    if (!resourceUrl) return;

    // Generate name from URL if no resource name provided
    const generatedName = resourceName || (() => {
      try {
        const url = new URL(resourceUrl);
        const pathname = url.pathname;
        const filename = pathname.split('/').pop() || url.hostname;
        // Remove file extension if present
        return filename.split('.')[0] || url.hostname;
      } catch {
        // If URL parsing fails, use the URL itself (truncated)
        return resourceUrl.length > 30 ? resourceUrl.substring(0, 30) + '...' : resourceUrl;
      }
    })();

    const newResource = {
      name: generatedName,
      url: resourceUrl,
      size: "—",
    };

    setUploadedFiles((prev) => [...prev, newResource]);

    setValue(
      "files",
      [...uploadedFiles, newResource].map((f) => ({
        name: f.name,
        url: f.url,
      })),
    );

    setValue("resource_name", "");
    setValue("resource_url", "");
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);

    setValue(
      "files",
      newFiles.map((f) => ({
        name: f.name,
        url: f.url,
      })),
    );
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
      year: componentData.year || 1,
      amount: componentData.amount || 0,
      module_number: componentData.module_number || 1,
      submission_deadline: formattedDeadline,
      instruction: componentData.instruction || "",
      instruction_video: componentData.instruction_video || "",
      files: componentData.files || [],
      submissions: {
        case_studies: submissions.case_studies || false,
        essays: submissions.essays || false,
        internships: submissions.internships || false,
      },
      status: componentData.status ?? true,
      resource_name: "",
      resource_url: "",
    };

    // Reset form and set type state together
    reset(formData);
    setSelectedType(componentType);
    setValue("type", componentType);
    setInstructionContent(componentData.instruction || "");

    if (componentData.files) {
      setUploadedFiles(
        componentData.files.map((file) => ({
          name: file.name,
          url: file.url,
          size: "—",
        })),
      );
    }
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

  const onSubmit = (data) => {
    const payload = {
      type: data.type,
      name: data.name,
      year: data.year,
      program: programId,
      files: uploadedFiles.map((f) => ({
        name: f.name,
        url: f.url,
      })),
      status: data.status,
    };

    if (data.type === "module") {
      payload.amount = data.amount;
      payload.module_number = data.module_number;
    }

    if (data.type === "app") {
      payload.submission_deadline = data.submission_deadline;
      payload.instruction = instructionContent.trim();
      payload.instruction_video = data.instruction_video;
      payload.submissions = data.submissions;
    }

    const mutation = isEdit ? updateComponent : createComponent;
    const args = isEdit ? { id: componentData._id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: () => {
        handleSuccessfulSubmit(data.type);
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createComponent.isPending || updateComponent.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border rounded-xl shadow-lg w-xl max-h-[90vh] overflow-y-auto p-6">
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
          <FormField
            label="Module Name"
            placeholder="Enter module name"
            error={errors.name?.message}
            required
            {...register("name")}
          />

          <div className="space-y-2">
            <Label>In which year the module belongs <span className="text-red-500">*</span></Label>
            <Select
              value={watch("year")?.toString() || ""}
              onValueChange={(v) => setValue("year", parseInt(v))}
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
          <div className="border rounded-xl p-4 space-y-4">
            <div className="space-y-1">
              <Label>Resource Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">URL</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Resource Name"
                placeholder="Create resource name"
                {...register("resource_name")}
              />

              {resourceType === "link" ? (
                <FormField
                  label="Enter URL"
                  placeholder="Enter URL"
                  type="url"
                  {...register("resource_url")}
                />
              ) : (
                <div className="space-y-2">
                  <Label>Upload Resource</Label>

                  <div className="relative">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    />

                    <div
                      className={cn(
                        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-[6px] border-[0.5px] px-3 py-1 text-base transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        "bg-white dark:text-white flex items-center justify-between",
                      )}
                    >
                      <span className="text-muted-foreground">Upload</span>
                      <Cloud className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="link"
              className="px-0"
              onClick={
                resourceType === "link"
                  ? addLinkResource
                  : () => {
                      const fileInput =
                        document.querySelector('input[type="file"]');
                      fileInput?.click();
                    }
              }
            >
              + Add
            </Button>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
          />
        </form>
      </div>
    </div>
  );
};

export default CreateComponent;
