import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useGetAllCountries,
  useGetAllCities,
  useGetAllLanguages,
} from "@/store/useDropdownStore";
import { useTranslation } from "react-i18next";
import { useCreateProgram, useUpdateProgram } from "@/store/useProgramStore";
import { programSchema } from "@/validations/admin";
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

const toSelectItem = (value) => {
  const id = toId(value);
  if (!id) return null;
  if (typeof value === "object") {
    return { _id: id, name: value.name || id };
  }
  return { _id: id, name: id };
};

const mergeSelectItems = (items, extra) => {
  const extraItem = toSelectItem(extra);
  if (!extraItem) return items;
  if (items.some((item) => String(item._id) === extraItem._id)) return items;
  return [extraItem, ...items];
};

const CreateProgram = ({ open, onClose, programData }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEdit = !!programData;

  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");

  const { data: programTypesResponse } = useQuery({
    queryKey: ["program-types"],
    queryFn: getProgramTypes,
    enabled: open,
    staleTime: 60000,
  });

  const programTypes = programTypesResponse?.data || PROGRAM_TYPES;

  const { data: countriesData, isLoading: countriesLoading } =
    useGetAllCountries(
      {
        ...(countrySearchTerm && { search: countrySearchTerm }),
      },
      { enabled: open },
    );

  const { data: languagesData, isLoading: languagesLoading } =
    useGetAllLanguages(
      {
        ...(languageSearchTerm && { search: languageSearchTerm }),
      },
      { enabled: open },
    );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      program_code: "",
      program_type: "",
      year: "",
      duration_unit: "years",
      language: "",
      city: "",
      country: "",
      is_online: false,
      document_required: true,
    },
  });

  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const selectedProgramType = watch("program_type");
  const selectedLanguage = watch("language");
  const selectedCity = watch("city");
  const watchedCountry = watch("country");
  const selectedDurationUnit = watch("duration_unit");
  const isOnlineValue = watch("is_online");
  const documentRequiredValue = watch("document_required");

  const { data: citiesData, isLoading: citiesLoading } = useGetAllCities(
    {
      ...(citySearchTerm && { search: citySearchTerm }),
      ...(watchedCountry && { country: watchedCountry }),
    },
    { enabled: open && !!watchedCountry },
  );

  const handleClose = () => {
    reset({
      name: "",
      program_code: "",
      program_type: "",
      year: "",
      duration_unit: "years",
      language: "",
      city: "",
      country: "",
      is_online: false,
      document_required: true,
    });
    setCountrySearchTerm("");
    setCitySearchTerm("");
    setLanguageSearchTerm("");
    onClose();
  };

  useEffect(() => {
    if (!open || !programData) return;

    const nextValues = {
      name: programData.name || "",
      program_code: programData.program_code || "",
      program_type: programData.program_type || "",
      year: programData.year || "",
      duration_unit: programData.duration_unit || "years",
      language: toId(programData.language),
      country: toId(programData.city?.country),
      city: toId(programData.city),
      is_online: programData.is_online || false,
      document_required: programData.document_required !== false,
    };

    reset(nextValues, { keepErrors: false });
  }, [open, programData, reset]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      program_code: formData.program_code,
      program_type: formData.program_type,
      year: formData.year,
      duration_unit: formData.duration_unit || "years",
      language: formData.language,
      is_online: formData.is_online || false,
      document_required: formData.document_required !== false,
    };

    if (formData.is_online) {
      if (formData.city) {
        payload.city = formData.city;
      } else if (isEdit) {
        payload.city = null;
      }
    } else {
      payload.city = formData.city;
    }

    const mutation = isEdit ? updateProgram : createProgram;
    const mutationData = isEdit
      ? { id: programData._id, data: payload }
      : payload;

    mutation.mutate(mutationData, {
      onSuccess: (response) => {
        handleClose();
        if (!isEdit && response?.data?._id) {
          navigate({
            to: "/admin/program/$id",
            params: { id: response.data._id },
          });
        }
      },
    });
  };

  const languageItems = mergeSelectItems(
    languagesData?.data || [],
    programData?.language,
  );
  const countryItems = mergeSelectItems(
    countriesData?.data || [],
    programData?.city?.country,
  );
  const cityItems = mergeSelectItems(
    citiesData?.data || [],
    toId(programData?.city?.country) === watchedCountry
      ? programData?.city
      : null,
  );

  if (!open) return null;

  const isSubmitting = createProgram.isPending || updateProgram.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit
                  ? t("programManagement.modal.editTitle")
                  : t("programManagement.modal.createTitle")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/70">
                {isEdit
                  ? t("programManagement.modal.editSubtitle")
                  : t("programManagement.modal.createSubtitle")}
              </p>
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
            <FormField
              label={t("programManagement.modal.nameLabel")}
              placeholder={t("programManagement.modal.namePlaceholder")}
              error={errors.name?.message}
              required
              {...register("name")}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("programManagement.modal.durationLabel")}
                placeholder={t(
                  `programManagement.modal.durationPlaceholder_${selectedDurationUnit}`,
                  t("programManagement.modal.durationPlaceholder")
                )}
                type="number"
                error={errors.year?.message}
                required
                {...register("year")}
              />

              <div className="space-y-2">
                <Label>
                  {t("programManagement.modal.durationUnitLabel", "Duration Unit")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  key={selectedDurationUnit || "empty-unit"}
                  value={selectedDurationUnit || "years"}
                  onValueChange={(value) =>
                    setValue("duration_unit", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "programManagement.modal.durationUnitPlaceholder",
                        "Select unit"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="years">
                      {t("common.durationUnits.years", "Years")}
                    </SelectItem>
                    <SelectItem value="months">
                      {t("common.durationUnits.months", "Months")}
                    </SelectItem>
                    <SelectItem value="weeks">
                      {t("common.durationUnits.weeks", "Weeks")}
                    </SelectItem>
                    <SelectItem value="days">
                      {t("common.durationUnits.days", "Days")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.duration_unit && (
                  <p className="text-red-500 text-sm">
                    {errors.duration_unit.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {t("programManagement.modal.programTypeLabel")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                key={selectedProgramType || "empty-type"}
                value={selectedProgramType || ""}
                onValueChange={(value) =>
                  setValue("program_type", value, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "programManagement.modal.programTypePlaceholder",
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
            <FormField
              label={t("programManagement.modal.codeLabel")}
              placeholder={t("programManagement.modal.codePlaceholder")}
              error={errors.program_code?.message}
              required
              {...register("program_code")}
            />

            <div className="flex items-center justify-between p-3.5 bg-sidebar rounded-lg border border-sidebar-border">
              <div className="space-y-0.5">
                <Label htmlFor="is-online" className="font-semibold text-sm">
                  {t("programManagement.modal.isOnlineLabel", "Online Programme")}
                </Label>
              </div>
              <Switch
                id="is-online"
                checked={isOnlineValue || false}
                onCheckedChange={(checked) => {
                  setValue("is_online", checked, { shouldValidate: true });
                  if (checked) {
                    setValue("country", "", { shouldValidate: true });
                    setValue("city", "", { shouldValidate: true });
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-sidebar rounded-lg border border-sidebar-border">
              <div className="space-y-0.5">
                <Label htmlFor="document-required" className="font-semibold text-sm">
                  {t("programManagement.modal.documentRequiredLabel", "Documents Required")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "programManagement.modal.documentRequiredDescription",
                    "Require ID and qualification uploads during application",
                  )}
                </p>
              </div>
              <Switch
                id="document-required"
                checked={documentRequiredValue !== false}
                onCheckedChange={(checked) =>
                  setValue("document_required", checked, { shouldValidate: true })
                }
              />
            </div>
            <SearchableSelect
              label={t("programManagement.modal.languageLabel")}
              placeholder={t("programManagement.modal.languagePlaceholder")}
              searchPlaceholder="Search languages..."
              items={languageItems}
              value={selectedLanguage || ""}
              onChange={(value) => {
                if (value) setValue("language", value, { shouldValidate: true });
              }}
              onSearch={setLanguageSearchTerm}
              isLoading={languagesLoading}
              error={errors.language?.message}
              required
            />

            {!isOnlineValue && (
              <>
                <SearchableSelect
                  label={t("programManagement.modal.countryLabel")}
                  placeholder={t("programManagement.modal.countryPlaceholder")}
                  searchPlaceholder="Search countries..."
                  items={countryItems}
                  value={watchedCountry || ""}
                  onChange={(value) => {
                    if (!value || value === watchedCountry) return;
                    setValue("country", value, { shouldValidate: true });
                    setValue("city", "");
                  }}
                  onSearch={setCountrySearchTerm}
                  isLoading={countriesLoading}
                  error={errors.country?.message}
                  required
                />

                <SearchableSelect
                  label={t("programManagement.modal.cityLabel")}
                  placeholder={
                    watchedCountry
                      ? t("programManagement.modal.cityPlaceholder")
                      : t("programManagement.modal.cityPlaceholderDisabled")
                  }
                  searchPlaceholder="Search cities..."
                  items={cityItems}
                  value={selectedCity || ""}
                  onChange={(value) => {
                    if (value) setValue("city", value, { shouldValidate: true });
                  }}
                  onSearch={setCitySearchTerm}
                  isLoading={citiesLoading}
                  error={errors.city?.message}
                  required
                  disabled={!watchedCountry}
                />
              </>
            )}

            <FormActions
              onCancel={handleClose}
              isLoading={isSubmitting}
              isEdit={isEdit}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProgram;
