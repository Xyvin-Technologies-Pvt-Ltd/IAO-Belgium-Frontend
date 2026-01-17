import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGetCountries } from "@/store/useCountryStore";
import { useGetCities } from "@/store/useCityStore";
import { useGetLanguages } from "@/store/useLanguageStore";
import { useTranslation } from "react-i18next";
import { useCreateProgram, useUpdateProgram } from "@/store/useProgramStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { programSchema } from "@/validations/admin";

const CreateProgram = ({ open, onClose, programData }) => {
  const { t } = useTranslation();
  const [languagePage, setLanguagePage] = useState(1);
  const [cityPage, setCityPage] = useState(1);
  const [countryPage, setCountryPage] = useState(1);
  const languageLimit = 10;
  const cityLimit = 10;
  const countryLimit = 10;

  const { data: countriesData } = useGetCountries(
    {
      page: countryPage,
      limit: countryLimit,
    },
    { enabled: open }
  );
  const { data: languagesData } = useGetLanguages(
    {
      page: languagePage,
      limit: languageLimit,
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
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      description: "",
      program_type: "",
      year: "",
      language: "",
      city: "",
      country: "",
    },
  });

  const isEdit = !!programData;
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const selectedCountry = watch("country");
  const selectedProgramType = watch("program_type");
  const selectedLanguage = watch("language");
  const selectedCity = watch("city");

  const { data: citiesData } = useGetCities({
    page: cityPage,
    limit: cityLimit,
    ...(selectedCountry ? { country: selectedCountry } : {}),
  }, { enabled: open && !!selectedCountry });

  // Reset cities when country changes
  useEffect(() => {
    setCityPage(1);
    setValue("city", "");
  }, [selectedCountry, setValue]);

  // Reset pagination when modal opens
  useEffect(() => {
    if (open) {
      setLanguagePage(1);
      setCityPage(1);
      setCountryPage(1);
    }
  }, [open]);

  const handleClose = () => {
    reset();
    setLanguagePage(1);
    setCityPage(1);
    setCountryPage(1);
    onClose();
  };

  useEffect(() => {
    if (programData && isEdit && open) {
      setValue('name', programData.name || '');
      setValue('description', programData.description || '');
      setValue('program_type', programData.program_type || '');
      setValue('year', programData.year || '');
      setValue('language', programData.language?._id || '');
      // Set country first, then city after a brief delay to ensure cities are fetched
      if (programData.city?.country?._id) {
        setValue('country', programData.city.country._id);
        // Use setTimeout to ensure the country is set and cities query is triggered
        setTimeout(() => {
          if (programData.city?._id) {
            setValue('city', programData.city._id);
          }
        }, 100);
      }
    }
  }, [programData, isEdit, setValue, open]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      description: formData.description,
      program_type: formData.program_type,
      year: formData.year,
      language: formData.language,
      city: formData.city,
    };

    const mutation = isEdit ? updateProgram: createProgram;
    const mutationData = isEdit ? { id: programData._id, data: payload } : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createProgram.isPending || updateProgram.isPending;

  const languages = languagesData?.data || [];
  const totalLanguages = languagesData?.total_count || 0;
  const totalLanguagePages = Math.ceil(totalLanguages / languageLimit);
  const hasLanguagePrev = languagePage > 1;
  const hasLanguageNext = languagePage < totalLanguagePages;

  const countries = countriesData?.data || [];
  const totalCountries = countriesData?.total_count || 0;
  const totalCountryPages = Math.ceil(totalCountries / countryLimit);
  const hasCountryPrev = countryPage > 1;
  const hasCountryNext = countryPage < totalCountryPages;

  const cities = citiesData?.data || [];
  const totalCities = citiesData?.total_count || 0;
  const totalCityPages = Math.ceil(totalCities / cityLimit);
  const hasCityPrev = cityPage > 1;
  const hasCityNext = cityPage < totalCityPages;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? t("programManagement.modal.editTitle") : t("programManagement.modal.createTitle")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/70">
            {isEdit ? t("programManagement.modal.editSubtitle") : t("programManagement.modal.createSubtitle")}
          </p>
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
              <Label>{t("programManagement.modal.descriptionLabel")} <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder={t("programManagement.modal.descriptionPlaceholder")}
                className="bg-white dark:bg-white/5"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("programManagement.modal.programTypeLabel")} <span className="text-red-500">*</span></Label>
              <Select
                key={selectedProgramType || 'empty-type'}
                value={selectedProgramType || ""}
                onValueChange={(value) => setValue("program_type", value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("programManagement.modal.programTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MSc">MSc</SelectItem>
                  <SelectItem value="BSc">BSc</SelectItem>
                </SelectContent>
              </Select>
              {errors.program_type && (
                <p className="text-red-500 text-sm">
                  {errors.program_type.message}
                </p>
              )}
            </div>

            <FormField
              label={t("programManagement.modal.yearLabel")}
              placeholder={t("programManagement.modal.yearPlaceholder")}
              type="number"
              error={errors.year?.message}
              required
              {...register("year")}
            />

            <div className="space-y-2">
              <Label>{t("programManagement.modal.languageLabel")} <span className="text-red-500">*</span></Label>
              <Select
                key={selectedLanguage || 'empty-language'}
                value={selectedLanguage || ""}
                onValueChange={(value) => setValue("language", value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("programManagement.modal.languagePlaceholder")} />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-(--radix-select-trigger-width)"
                >
                  <div className="max-h-75 overflow-y-auto">
                    {languages?.map((language) => (
                      <SelectItem key={language._id} value={language._id}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </div>
                  {totalLanguages > languageLimit && (
                    <div className="flex items-center justify-center gap-2 px-2 py-2 border-t bg-background sticky bottom-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setLanguagePage((prev) => Math.max(1, prev - 1));
                        }}
                        disabled={!hasLanguagePrev}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setLanguagePage((prev) => prev + 1);
                        }}
                        disabled={!hasLanguageNext}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.language && (
                <p className="text-red-500 text-sm">
                  {errors.language.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("programManagement.modal.countryLabel")} <span className="text-red-500">*</span></Label>
              <Select
                key={selectedCountry || 'empty-country'}
                value={selectedCountry || ""}
                onValueChange={(value) => {
                  setValue("country", value, { shouldValidate: true });
                  setValue("city", ""); // Reset city when country changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("programManagement.modal.countryPlaceholder")} />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-(--radix-select-trigger-width)"
                >
                  <div className="max-h-75 overflow-y-auto">
                    {countries?.map((country) => (
                      <SelectItem key={country._id} value={country._id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </div>
                  {totalCountries > countryLimit && (
                    <div className="flex items-center justify-center gap-2 px-2 py-2 border-t bg-background sticky bottom-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setCountryPage((prev) => Math.max(1, prev - 1));
                        }}
                        disabled={!hasCountryPrev}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setCountryPage((prev) => prev + 1);
                        }}
                        disabled={!hasCountryNext}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-red-500 text-sm">
                  {errors.country.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("programManagement.modal.cityLabel")} <span className="text-red-500">*</span></Label>
              <Select
                key={selectedCity || 'empty-city'}
                value={selectedCity || ""}
                onValueChange={(value) => setValue("city", value, { shouldValidate: true })}
                disabled={!selectedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCountry ? t("programManagement.modal.cityPlaceholder") : t("programManagement.modal.cityPlaceholderDisabled")} />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-(--radix-select-trigger-width)"
                >
                  <div className="max-h-75 overflow-y-auto">
                    {cities?.map((city) => (
                      <SelectItem key={city._id} value={city._id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </div>
                  {totalCities > cityLimit && (
                    <div className="flex items-center justify-center gap-2 px-2 py-2 border-t bg-background sticky bottom-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setCityPage((prev) => Math.max(1, prev - 1));
                        }}
                        disabled={!hasCityPrev}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setCityPage((prev) => prev + 1);
                        }}
                        disabled={!hasCityNext}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.city && (
                <p className="text-red-500 text-sm">
                  {errors.city.message}
                </p>
              )}
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
