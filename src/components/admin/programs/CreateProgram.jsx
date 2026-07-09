import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { Input } from "@/components/ui/input";
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
import {
  getGlobalVatConfig,
  resolveAccountingMapping,
} from "@/api/accountingMappingApi";
import { getProgramTypes } from "@/api/programApi";

const emptyAccountingDefaults = {
  program_code: "",
  exact_vat_code: "",
  gl_revenue_module: "",
  gl_revenue_research: "",
  gl_revenue_admission_fee: "",
  gl_revenue_convenience_fee: "",
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

  const [selectedCountry, setSelectedCountry] = useState("");

  const { data: citiesData, isLoading: citiesLoading } = useGetAllCities(
    {
      ...(citySearchTerm && { search: citySearchTerm }),
      ...(selectedCountry && { country: selectedCountry }),
    },
    { enabled: open && !!selectedCountry },
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
    getValues,
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
      exact_vat_code: "",
      gl_revenue_module: "",
      gl_revenue_research: "",
      gl_revenue_admission_fee: "",
      gl_revenue_convenience_fee: "",
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

  useEffect(() => {
    if (watchedCountry !== selectedCountry) {
      setSelectedCountry(watchedCountry);
      if (watchedCountry !== selectedCountry && selectedCity) {
        setValue("city", "", { shouldValidate: true });
      }
    }
  }, [watchedCountry, selectedCountry, selectedCity, setValue]);

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
      ...emptyAccountingDefaults,
    });
    setCountrySearchTerm("");
    setCitySearchTerm("");
    setLanguageSearchTerm("");
    setSelectedCountry("");
    onClose();
  };

  useEffect(() => {
    if (!open || !programData) return;

    reset({
      name: programData.name || "",
      program_code: programData.program_code || "",
      program_type: programData.program_type || "",
      year: programData.year || "",
      duration_unit: programData.duration_unit || "years",
      language: programData.language?._id || "",
      country: programData.city?.country?._id || "",
      city: programData.city?._id || "",
      is_online: programData.is_online || false,
      document_required: programData.document_required !== false,
      exact_vat_code: programData.exact_vat_code || "",
      gl_revenue_module: programData.gl_revenue_module || "",
      gl_revenue_research: programData.gl_revenue_research || "",
      gl_revenue_admission_fee: programData.gl_revenue_admission_fee || "",
      gl_revenue_convenience_fee: programData.gl_revenue_convenience_fee || "",
    });

    if (programData.city?.country?._id) {
      setSelectedCountry(programData.city.country._id);
    }
  }, [open, programData, reset]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const languageId =
      selectedLanguage || (isEdit ? programData?.language?._id : "") || "";
    const programType =
      selectedProgramType || (isEdit ? programData?.program_type : "") || "";

    if (!languageId || !programType) {
      return;
    }

    if (!isOnlineValue) {
      const countryId =
        watchedCountry || (isEdit ? programData?.city?.country?._id : "") || "";
      if (!countryId) {
        return;
      }
    }

    let cancelled = false;

    const loadAccountingDefaults = async () => {
      try {
        const countryId = isOnlineValue
          ? undefined
          : watchedCountry || (isEdit ? programData?.city?.country?._id : "") || "";

        const [mappingResponse, vatResponse] = await Promise.all([
          resolveAccountingMapping({
            language: languageId,
            ...(countryId ? { country: countryId } : {}),
            program_type: programType,
          }),
          getGlobalVatConfig(),
        ]);

        if (cancelled) return;

        const mapping = mappingResponse?.data || {};
        const globalVat = vatResponse?.data?.vat_code || "";

        const applyField = (field, value) => {
          if (isEdit) {
            const current = getValues(field);
            if (String(current || "").trim()) {
              return;
            }
          }
          setValue(field, value, { shouldValidate: true });
        };

        applyField("exact_vat_code", globalVat);
        applyField("gl_revenue_module", mapping.gl_revenue_module || "");
        applyField("gl_revenue_research", mapping.gl_revenue_research || "");
        applyField(
          "gl_revenue_admission_fee",
          mapping.gl_revenue_admission_fee || "",
        );
        applyField(
          "gl_revenue_convenience_fee",
          mapping.gl_revenue_convenience_fee || "",
        );
      } catch {
        // mapping lookup failed; leave fields for manual entry
      }
    };

    loadAccountingDefaults();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    isEdit,
    programData,
    selectedLanguage,
    watchedCountry,
    selectedProgramType,
    isOnlineValue,
    setValue,
    getValues,
  ]);

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

    payload.exact_vat_code = formData.exact_vat_code?.trim().toUpperCase() || "";
    payload.gl_revenue_module = formData.gl_revenue_module?.trim() || "";
    payload.gl_revenue_research = formData.gl_revenue_research?.trim() || "";
    payload.gl_revenue_admission_fee =
      formData.gl_revenue_admission_fee?.trim() || "";
    payload.gl_revenue_convenience_fee =
      formData.gl_revenue_convenience_fee?.trim() || "";

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
                    setSelectedCountry("");
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
              items={languagesData?.data || []}
              value={selectedLanguage || ""}
              onChange={(value) =>
                setValue("language", value, { shouldValidate: true })
              }
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
                  items={countriesData?.data || []}
                  value={watchedCountry || ""}
                  onChange={(value) =>
                    setValue("country", value, { shouldValidate: true })
                  }
                  onSearch={setCountrySearchTerm}
                  isLoading={countriesLoading}
                  error={errors.country?.message}
                  required
                />

                <SearchableSelect
                  label={t("programManagement.modal.cityLabel")}
                  placeholder={
                    selectedCountry
                      ? t("programManagement.modal.cityPlaceholder")
                      : t("programManagement.modal.cityPlaceholderDisabled")
                  }
                  searchPlaceholder="Search cities..."
                  items={citiesData?.data || []}
                  value={selectedCity || ""}
                  onChange={(value) =>
                    setValue("city", value, { shouldValidate: true })
                  }
                  onSearch={setCitySearchTerm}
                  isLoading={citiesLoading}
                  error={errors.city?.message}
                  required
                  disabled={!selectedCountry}
                />
              </>
            )}

            <div className="rounded-lg border border-sidebar-border bg-sidebar/50 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("programManagement.modal.exactSectionTitle")}
              </h3>
              <FormField
                label={t("programManagement.modal.exactGlRevenueModuleLabel")}
                error={errors.gl_revenue_module?.message}
              >
                <Input readOnly {...register("gl_revenue_module")} />
              </FormField>
              <FormField
                label={t("programManagement.modal.exactGlRevenueResearchLabel")}
                error={errors.gl_revenue_research?.message}
              >
                <Input readOnly {...register("gl_revenue_research")} />
              </FormField>
              <FormField
                label={t(
                  "programManagement.modal.exactGlRevenueAdmissionFeeLabel",
                )}
                error={errors.gl_revenue_admission_fee?.message}
              >
                <Input readOnly {...register("gl_revenue_admission_fee")} />
              </FormField>
              <FormField
                label={t(
                  "programManagement.modal.exactGlRevenueConvenienceFeeLabel",
                )}
                error={errors.gl_revenue_convenience_fee?.message}
              >
                <Input readOnly {...register("gl_revenue_convenience_fee")} />
              </FormField>
              <FormField
                label={t("programManagement.modal.exactVatCodeLabel")}
                error={errors.exact_vat_code?.message}
              >
                <Input readOnly {...register("exact_vat_code")} />
              </FormField>
            </div>

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
