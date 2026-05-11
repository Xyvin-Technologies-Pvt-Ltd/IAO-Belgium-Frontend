import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  useGetAllCountries,
  useGetAllCities,
  useGetAllLanguages,
} from "@/store/useDropdownStore";
import { useTranslation } from "react-i18next";
import { useCreateProgram, useUpdateProgram } from "@/store/useProgramStore";
import { programSchema } from "@/validations/admin";
import { useNavigate } from "@tanstack/react-router";

const CreateProgram = ({ open, onClose, programData }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEdit = !!programData;

  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");

  const [selectedCountry, setSelectedCountry] = useState("");

  const { data: countriesData, isLoading: countriesLoading } =
    useGetAllCountries(
      {
        ...(countrySearchTerm && { search: countrySearchTerm }),
      },
      { enabled: open },
    );

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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      program_code: "",
      program_type: "",
      year: "",
      language: "",
      city: "",
      country: "",
    },
  });

  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const selectedProgramType = watch("program_type");
  const selectedLanguage = watch("language");
  const selectedCity = watch("city");
  const watchedCountry = watch("country");

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
      language: "",
      city: "",
      country: "",
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
      language: programData.language?._id || "",
      country: programData.city?.country?._id || "",
      city: programData.city?._id || "",
    });

    if (programData.city?.country?._id) {
      setSelectedCountry(programData.city.country._id);
    }
  }, [open, programData, reset]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      program_code: formData.program_code,
      program_type: formData.program_type,
      year: formData.year,
      language: formData.language,
      city: formData.city,
    };

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
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
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
                  <SelectItem value="Master of Science">
                    {t("programManagement.modal.programTypes.masterOfScience")}
                  </SelectItem>
                  <SelectItem value="Lateral Entry Master of Science">
                    {t("programManagement.modal.programTypes.lateralEntry")}
                  </SelectItem>
                  <SelectItem value="Diploma">
                    {t("programManagement.modal.programTypes.diploma")}
                  </SelectItem>
                  <SelectItem value="Manual Therapie">
                    {t("programManagement.modal.programTypes.manualTherapie")}
                  </SelectItem>
                  <SelectItem value="Post Academic Module">
                    {t("programManagement.modal.programTypes.postAcademic")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.program_type && (
                <p className="text-red-500 text-sm">
                  {errors.program_type.message}
                </p>
              )}
            </div>

            <FormField
              label={t("programManagement.modal.durationLabel")}
              placeholder={t("programManagement.modal.durationPlaceholder")}
              type="number"
              error={errors.year?.message}
              required
              {...register("year")}
            />
            <FormField
              label={t("programManagement.modal.codeLabel")}
              placeholder={t("programManagement.modal.codePlaceholder")}
              error={errors.program_code?.message}
              required
              {...register("program_code")}
            />
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
