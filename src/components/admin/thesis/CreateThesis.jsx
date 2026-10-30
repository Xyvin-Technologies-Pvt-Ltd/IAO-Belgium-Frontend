import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Upload,
  Trash2,
  FileText,
  Download,
  Loader2,
  Paperclip,
  Eye,
} from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  useGetAllAcademicYears,
  useGetAllPrograms,
} from "@/store/useDropdownStore";
import { useTranslation } from "react-i18next";
import { useCreateThesis, useUpdateThesis } from "@/store/useThesisStore";
import { thesisSchema } from "@/validations/admin";
import { useNavigate } from "@tanstack/react-router";
import {
  PROGRAM_TYPE_I18N_KEYS,
  PROGRAM_TYPES,
} from "@/constants/programTypes";
import { getProgramTypes } from "@/api/programApi";
import { uploadFile } from "@/api/uploadApi";
import { openSecureFile, downloadSecureFile } from "@/utils/secureFile";
import { toast } from "sonner";

const toId = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const id = value._id ?? value.id;
    return id != null && id !== "" ? String(id) : "";
  }
  return String(value);
};

const formatProgramOption = (p) => {
  if (!p) return "";
  const city = p.is_online
    ? "Online"
    : p.city?.name || (typeof p.city === "string" ? p.city : null);
  const language =
    p.language?.name || (typeof p.language === "string" ? p.language : null);
  const details = [city, language].filter(Boolean).join(" - ");
  return details ? `${p.name} - ${details}` : p.name;
};

const CreateThesis = ({ open, onClose, thesisData }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEdit = !!thesisData;

  const createThesis = useCreateThesis();
  const updateThesis = useUpdateThesis();

  const [descriptionContent, setDescriptionContent] = useState("");
  const [academicSearchTerm, setAcademicSearchTerm] = useState("");
  const [programSearchTerm, setProgramSearchTerm] = useState("");

  // Documents state
  const [attachments, setAttachments] = useState([]);
  const [newDocName, setNewDocName] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const { data: programTypesResponse } = useQuery({
    queryKey: ["program-types"],
    queryFn: getProgramTypes,
    enabled: open,
    staleTime: 60000,
  });

  const programTypes = programTypesResponse?.data || PROGRAM_TYPES;

  const { data: academicYearsData, isLoading: academicYearsLoading } =
    useGetAllAcademicYears(
      {
        ...(academicSearchTerm && { search: academicSearchTerm }),
      },
      { enabled: open }
    );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(thesisSchema),
    defaultValues: {
      name: "",
      academic: [],
      program_type: "",
      program: [],
      current_year: [],
      price: "",
      description: "",
      attachments: [],
      status: true,
    },
  });

  const selectedProgramType = watch("program_type");
  const watchedStudyYears = watch("current_year");
  const watchedAcademics = watch("academic");
  const watchedPrograms = watch("program");
  const statusValue = watch("status");

  // Fetch programs filtered by selected program_type and search term on backend
  const { data: programsData, isLoading: programsLoading } =
    useGetAllPrograms(
      {
        status: "active",
        ...(selectedProgramType ? { program_type: selectedProgramType } : {}),
        ...(programSearchTerm && { search: programSearchTerm }),
      },
      { enabled: open && !!selectedProgramType }
    );

  const selectedAcademics = useMemo(
    () => watchedAcademics || [],
    [watchedAcademics]
  );
  const selectedPrograms = useMemo(
    () => watchedPrograms || [],
    [watchedPrograms]
  );

  // Academic year items for multi-select
  const academicItems = useMemo(() => {
    const raw = academicYearsData?.data || [];
    const list = raw.map((a) => ({
      _id: String(a._id),
      name: a.name || "Academic Year",
    }));

    // If editing, ensure any already selected academic years are in the items list
    if (isEdit && selectedAcademics.length > 0) {
      for (const sel of selectedAcademics) {
        if (!list.some((item) => String(item._id) === String(sel._id))) {
          list.unshift(sel);
        }
      }
    }
    return list;
  }, [academicYearsData?.data, isEdit, selectedAcademics]);

  // Formatted program items from backend-filtered response
  const programItems = useMemo(() => {
    const list = programsData?.data || [];
    const formatted = list.map((p) => ({
      _id: String(p._id),
      name: formatProgramOption(p),
      rawName: p.name,
      city: p.city,
      language: p.language,
      program_type: p.program_type,
      year: Number(p.year) || 1,
    }));

    // If editing or selected programmes exist for this type, ensure they are present in items list
    if (selectedPrograms.length > 0) {
      for (const sp of selectedPrograms) {
        if (!formatted.some((p) => String(p._id) === String(sp._id))) {
          formatted.unshift(sp);
        }
      }
    }

    return formatted;
  }, [programsData?.data, selectedPrograms]);

  // Calculate highest program.year among selected programmes
  const maxStudyYear = useMemo(() => {
    if (!selectedPrograms.length) return 0;
    let max = 1;
    const allKnownPrograms = [
      ...(programsData?.data || []),
      ...(Array.isArray(thesisData?.program) ? thesisData.program : []),
    ];
    for (const sp of selectedPrograms) {
      const spId = String(toId(sp));
      const match = allKnownPrograms.find((p) => String(toId(p)) === spId);
      const yr = Number(match?.year || sp?.year || 1);
      if (yr > max) max = yr;
    }
    return max;
  }, [selectedPrograms, programsData?.data, thesisData?.program]);

  // Items for SearchableMultiSelect Study Year
  const studyYearItems = useMemo(() => {
    if (maxStudyYear < 1) return [];
    return Array.from({ length: maxStudyYear }, (_, i) => {
      const yr = i + 1;
      return {
        _id: String(yr),
        name: t("thesisManagement.modal.yearOption", `Year ${yr}`, { year: yr }),
        year: yr,
      };
    });
  }, [maxStudyYear, t]);

  // Selected Study Year items formatted for SearchableMultiSelect
  const selectedStudyYears = useMemo(() => {
    if (!watchedStudyYears) return [];
    const raw = Array.isArray(watchedStudyYears)
      ? watchedStudyYears
      : [watchedStudyYears];

    return raw
      .map((item) => {
        if (item && typeof item === "object") {
          const id = String(toId(item) || item._id || item.year || "");
          if (!id) return null;
          return {
            _id: id,
            name:
              item.name ||
              t("thesisManagement.modal.yearOption", `Year ${id}`, { year: id }),
            year: Number(id),
          };
        }
        const num = Number(item);
        if (isNaN(num) || num < 1) return null;
        return {
          _id: String(num),
          name: t("thesisManagement.modal.yearOption", `Year ${num}`, {
            year: num,
          }),
          year: num,
        };
      })
      .filter(Boolean);
  }, [watchedStudyYears, t]);

  // Adjust study year if any selected exceeds maxStudyYear
  useEffect(() => {
    if (selectedStudyYears.length > 0 && maxStudyYear > 0) {
      const valid = selectedStudyYears.filter(
        (item) => Number(item.year || item._id) <= maxStudyYear
      );
      if (valid.length !== selectedStudyYears.length) {
        setValue("current_year", valid, { shouldValidate: true });
      }
    }
  }, [maxStudyYear, selectedStudyYears, setValue]);

  useEffect(() => {
    if (open) {
      if (thesisData) {
        // Normalize academic array
        const normalizedAcademics = Array.isArray(thesisData.academic)
          ? thesisData.academic.map((a) => ({
              _id: String(toId(a)),
              name: a?.name || toId(a),
            }))
          : thesisData.academic
            ? [
                {
                  _id: String(toId(thesisData.academic)),
                  name: thesisData.academic?.name || toId(thesisData.academic),
                },
              ]
            : [];

        // Normalize program array
        const rawPrograms = Array.isArray(thesisData.program)
          ? thesisData.program
          : thesisData.program
            ? [thesisData.program]
            : [];

        const normalizedPrograms = rawPrograms.map((p) => ({
          _id: String(toId(p)),
          name: formatProgramOption(p) || p?.name || toId(p),
          program_type: p?.program_type || "",
          year: Number(p?.year) || 1,
        }));

        const progType =
          rawPrograms.find((p) => p && typeof p === "object" && p.program_type)
            ?.program_type ||
          thesisData.program_type ||
          "";

        const normalizedYears = Array.isArray(thesisData.current_year)
          ? thesisData.current_year.map((y) => ({
              _id: String(y),
              name: t("thesisManagement.modal.yearOption", `Year ${y}`, {
                year: y,
              }),
              year: Number(y),
            }))
          : thesisData.current_year != null && thesisData.current_year !== ""
            ? [
                {
                  _id: String(thesisData.current_year),
                  name: t(
                    "thesisManagement.modal.yearOption",
                    `Year ${thesisData.current_year}`,
                    { year: thesisData.current_year }
                  ),
                  year: Number(thesisData.current_year),
                },
              ]
            : [];

        const normalizedAttachments = Array.isArray(thesisData.attachments)
          ? thesisData.attachments.map((att) => ({
              name: att.name || att.filename || "",
              file_url: att.file_url,
            }))
          : [];

        setAttachments(normalizedAttachments);

        reset({
          name: thesisData.name || "",
          academic: normalizedAcademics,
          program_type: progType,
          program: normalizedPrograms,
          current_year: normalizedYears,
          price: thesisData.price != null ? String(thesisData.price) : "",
          description: thesisData.description || "",
          attachments: normalizedAttachments,
          status: thesisData.status ?? true,
        });
        setDescriptionContent(thesisData.description || "");
      } else {
        setAttachments([]);
        setNewDocName("");
        setPendingFile(null);
        reset({
          name: "",
          academic: [],
          program_type: "",
          program: [],
          current_year: [],
          price: "",
          description: "",
          attachments: [],
          status: true,
        });
        setDescriptionContent("");
      }
    }
  }, [open, thesisData, reset, t]);

  const handleProgramTypeChange = (newType) => {
    if (newType === selectedProgramType) return;
    setValue("program_type", newType, { shouldValidate: true });
    // Changing type clears the programme list and study years
    setValue("program", [], { shouldValidate: true });
    setValue("current_year", [], { shouldValidate: true });
    setProgramSearchTerm("");
  };

  const handleClose = () => {
    reset({
      name: "",
      academic: [],
      program_type: "",
      program: [],
      current_year: [],
      price: "",
      description: "",
      attachments: [],
      status: true,
    });
    setAttachments([]);
    setNewDocName("");
    setPendingFile(null);
    setDescriptionContent("");
    setProgramSearchTerm("");
    setAcademicSearchTerm("");
    onClose();
  };

  const handleFileChosen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    // Auto-populate document name if empty
    if (!newDocName.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setNewDocName(baseName);
    }
    e.target.value = "";
  };

  const handleAddDocument = async () => {
    if (!pendingFile) return;
    const docName = (newDocName.trim() || pendingFile.name);
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
      const updated = [...attachments, newAttachment];
      setAttachments(updated);
      setValue("attachments", updated, { shouldValidate: true });
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
    const updated = [...attachments];
    updated[index] = { ...updated[index], name: value };
    setAttachments(updated);
    setValue("attachments", updated, { shouldValidate: true });
  };

  const handleRemoveAttachment = (indexToRemove) => {
    const updated = attachments.filter((_, idx) => idx !== indexToRemove);
    setAttachments(updated);
    setValue("attachments", updated, { shouldValidate: true });
  };

  const onSubmit = (formData) => {
    const rawYears = formData.current_year || [];
    const normalizedYears = Array.isArray(rawYears)
      ? rawYears
          .map((y) =>
            typeof y === "object" ? Number(y.year || y._id) : Number(y)
          )
          .filter((n) => !isNaN(n) && n > 0)
      : [Number(rawYears)].filter((n) => !isNaN(n) && n > 0);

    const payload = {
      name: formData.name.trim(),
      academic: (formData.academic || []).map((a) => a._id || a),
      program: (formData.program || []).map((p) => p._id || p),
      current_year: normalizedYears,
      price: Number(formData.price) || 0,
      description: descriptionContent || "",
      attachments: attachments.map((att) => ({
        name: (att.name || "").trim(),
        file_url: att.file_url,
      })),
    };

    if (!isEdit) {
      payload.status = formData.status ?? true;
    }

    if (isEdit) {
      updateThesis.mutate(
        { id: thesisData._id, data: payload },
        {
          onSuccess: () => {
            handleClose();
          },
        }
      );
    } else {
      createThesis.mutate(payload, {
        onSuccess: (response) => {
          handleClose();
          if (response?.data?._id) {
            navigate({
              to: "/admin/thesis/$id",
              params: { id: response.data._id },
            });
          }
        },
      });
    }
  };

  if (!open) return null;

  const isSubmitting = createThesis.isPending || updateThesis.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit
                  ? t("thesisManagement.modal.editTitle", "Edit Thesis")
                  : t("thesisManagement.modal.createTitle", "Create Thesis")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/70">
                {isEdit
                  ? t(
                      "thesisManagement.modal.editSubtitle",
                      "Update the thesis details"
                    )
                  : t(
                      "thesisManagement.modal.createSubtitle",
                      "Add a new thesis to the catalog"
                    )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Thesis Name */}
            <FormField
              label={t("thesisManagement.modal.nameLabel", "Thesis Name")}
              placeholder={t(
                "thesisManagement.modal.namePlaceholder",
                "Enter thesis name"
              )}
              error={errors.name?.message}
              required
              {...register("name")}
            />

            {/* Academic Year (Multi-select) */}
            <SearchableMultiSelect
              label={t("thesisManagement.modal.academicLabel", "Academic Years")}
              placeholder={t(
                "thesisManagement.modal.academicPlaceholder",
                "Select academic year(s)..."
              )}
              searchPlaceholder={t(
                "thesisManagement.modal.searchAcademic",
                "Search academic years..."
              )}
              items={academicItems}
              selected={selectedAcademics}
              onChange={(val) => {
                setValue("academic", val, { shouldValidate: true });
              }}
              onSearch={setAcademicSearchTerm}
              error={errors.academic?.message}
              required
              isLoading={academicYearsLoading}
            />

            {/* Program Type (form-only filter) */}
            <div className="space-y-2">
              <Label>
                {t("thesisManagement.modal.programTypeLabel", "Programme Type")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                key={selectedProgramType || "empty-type"}
                value={selectedProgramType || ""}
                onValueChange={handleProgramTypeChange}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "thesisManagement.modal.programTypePlaceholder",
                      "Select programme type first"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {programTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(PROGRAM_TYPE_I18N_KEYS[type] || type, type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.program_type && (
                <p className="text-red-500 text-sm">
                  {errors.program_type.message}
                </p>
              )}
            </div>

            {/* Programmes (Multi-select) */}
            <SearchableMultiSelect
              label={t("thesisManagement.modal.programLabel", "Programmes")}
              placeholder={
                !selectedProgramType
                  ? t(
                      "thesisManagement.modal.selectTypeFirst",
                      "Please select programme type first"
                    )
                  : t(
                      "thesisManagement.modal.programPlaceholder",
                      "Select programme(s)..."
                    )
              }
              searchPlaceholder={t(
                "thesisManagement.modal.searchProgram",
                "Search programmes..."
              )}
              items={programItems}
              selected={selectedPrograms}
              onChange={(val) => {
                setValue("program", val, { shouldValidate: true });
              }}
              onSearch={setProgramSearchTerm}
              error={errors.program?.message}
              required
              disabled={!selectedProgramType}
              isLoading={programsLoading}
            />

            {/* Study Year (Multi-select via SearchableMultiSelect) */}
            <SearchableMultiSelect
              label={t("thesisManagement.modal.studyYearLabel", "Study Year(s)")}
              placeholder={
                !selectedPrograms.length
                  ? t(
                      "thesisManagement.modal.selectProgramFirst",
                      "Please select programme(s) first"
                    )
                  : t(
                      "thesisManagement.modal.studyYearPlaceholder",
                      "Select study year(s)..."
                    )
              }
              searchPlaceholder={t(
                "thesisManagement.modal.searchStudyYear",
                "Search study years..."
              )}
              items={studyYearItems}
              selected={selectedStudyYears}
              onChange={(val) => {
                setValue("current_year", val, { shouldValidate: true });
              }}
              error={errors.current_year?.message}
              required
              disabled={!selectedPrograms.length}
            />

            {/* Price (EUR) - type="text" to prevent scroll wheel changing the number */}
            <FormField
              label={t("thesisManagement.modal.priceLabel", "Price (€ EUR)")}
              placeholder="0.00"
              type="text"
              inputMode="decimal"
              error={errors.price?.message}
              required
              onWheel={(e) => e.target.blur()}
              {...register("price")}
            />

            {/* Description RichTextEditor */}
            <div className="space-y-2">
              <Label>
                {t("thesisManagement.modal.descriptionLabel", "Description")}
              </Label>
              <RichTextEditor
                value={descriptionContent}
                onChange={setDescriptionContent}
                placeholder={t(
                  "thesisManagement.modal.descriptionPlaceholder",
                  "Enter thesis description and overview..."
                )}
              />
            </div>

            {/* Documents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-semibold text-sm flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    {t("thesisManagement.modal.documentsLabel", "Documents")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "thesisManagement.modal.documentsHint",
                      "Upload documents, guidelines, or materials visible to students."
                    )}
                  </p>
                </div>
                {attachments.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {attachments.length}{" "}
                    {attachments.length === 1
                      ? t("common.file", "file")
                      : t("common.files", "files")}
                  </span>
                )}
              </div>

              {/* Add Document Box with Name Field & File Chooser */}
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-foreground">
                      {t("thesisManagement.modal.docNameLabel", "Document Name")}
                    </Label>
                    <Input
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder={t(
                        "thesisManagement.modal.docNamePlaceholder",
                        "e.g. Thesis Guidelines"
                      )}
                      className="h-9 text-sm"
                      disabled={isUploadingAttachment}
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
                                "thesisManagement.modal.chooseFile",
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

              {/* Documents List */}
              {attachments.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {attachments.map((file, idx) => (
                    <div
                      key={file.file_url || idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/60 hover:bg-muted/40 transition-colors gap-3"
                    >
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0 self-center">
                        <FileText className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Input
                          value={file.name ?? ""}
                          onChange={(e) => handleUpdateDocName(idx, e.target.value)}
                          placeholder={t(
                            "thesisManagement.modal.docNameLabel",
                            "Document Name"
                          )}
                          className="h-8 text-xs sm:text-sm font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0 self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          title={t("common.view", "View")}
                          onClick={() =>
                            openSecureFile(file.file_url, file.name)
                          }
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          title={t("common.download", "Download")}
                          onClick={() =>
                            downloadSecureFile(file.file_url, file.name)
                          }
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title={t("common.delete", "Delete")}
                          onClick={() => handleRemoveAttachment(idx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Switch (Create only) */}
            {!isEdit && (
              <div className="flex items-center justify-between p-3.5 bg-sidebar rounded-lg border border-sidebar-border">
                <div className="space-y-0.5">
                  <Label htmlFor="thesis-status" className="font-semibold text-sm">
                    {t("thesisManagement.modal.statusLabel", "Status")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {statusValue
                      ? t(
                          "thesisManagement.modal.activeNotice",
                          "Active — visible and available for enrolments"
                        )
                      : t(
                          "thesisManagement.modal.inactiveNotice",
                          "Inactive — enrolments will be blocked"
                        )}
                  </p>
                </div>
                <Switch
                  id="thesis-status"
                  checked={statusValue ?? true}
                  onCheckedChange={(checked) =>
                    setValue("status", checked, { shouldValidate: true })
                  }
                />
              </div>
            )}

            {/* Form Actions */}
            <FormActions
              onCancel={handleClose}
              isLoading={isSubmitting}
              isEdit={isEdit}
              submitText={
                isEdit
                  ? t("thesisManagement.modal.update", "Update Thesis")
                  : t("thesisManagement.modal.create", "Create Thesis")
              }
              cancelText={t("common.cancel", "Cancel")}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateThesis;
