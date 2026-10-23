import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
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
      price: "",
      description: "",
      status: true,
    },
  });

  const selectedProgramType = watch("program_type");
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
        }));

        const progType =
          rawPrograms.find((p) => p && typeof p === "object" && p.program_type)?.program_type ||
          thesisData.program_type ||
          "";

        reset({
          name: thesisData.name || "",
          academic: normalizedAcademics,
          program_type: progType,
          program: normalizedPrograms,
          price: thesisData.price != null ? String(thesisData.price) : "",
          description: thesisData.description || "",
          status: thesisData.status ?? true,
        });
        setDescriptionContent(thesisData.description || "");
      } else {
        reset({
          name: "",
          academic: [],
          program_type: "",
          program: [],
          price: "",
          description: "",
          status: true,
        });
        setDescriptionContent("");
      }
    }
  }, [open, thesisData, reset]);

  const handleProgramTypeChange = (newType) => {
    if (newType === selectedProgramType) return;
    setValue("program_type", newType, { shouldValidate: true });
    // Changing type clears the programme list and program search term
    setValue("program", [], { shouldValidate: true });
    setProgramSearchTerm("");
  };

  const handleClose = () => {
    reset({
      name: "",
      academic: [],
      program_type: "",
      program: [],
      price: "",
      description: "",
      status: true,
    });
    setDescriptionContent("");
    setProgramSearchTerm("");
    setAcademicSearchTerm("");
    onClose();
  };

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name.trim(),
      academic: (formData.academic || []).map((a) => a._id || a),
      program: (formData.program || []).map((p) => p._id || p),
      price: Number(formData.price) || 0,
      description: descriptionContent || "",
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
                  ? t("thesisManagement.modal.editSubtitle", "Update the thesis details")
                  : t("thesisManagement.modal.createSubtitle", "Add a new thesis to the catalog")}
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
              placeholder={t("thesisManagement.modal.namePlaceholder", "Enter thesis name")}
              error={errors.name?.message}
              required
              {...register("name")}
            />

            {/* Academic Year (Multi-select) */}
            <SearchableMultiSelect
              label={t("thesisManagement.modal.academicLabel", "Academic Years")}
              placeholder={t("thesisManagement.modal.academicPlaceholder", "Select academic year(s)...")}
              searchPlaceholder={t("thesisManagement.modal.searchAcademic", "Search academic years...")}
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
                  ? t("thesisManagement.modal.selectTypeFirst", "Please select programme type first")
                  : t("thesisManagement.modal.programPlaceholder", "Select programme(s)...")
              }
              searchPlaceholder={t("thesisManagement.modal.searchProgram", "Search programmes...")}
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
