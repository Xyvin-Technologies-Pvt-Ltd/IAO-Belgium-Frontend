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
import { programSchema } from "@/validations/admin";
import PaginatedSelect from "@/components/ui/forms/PaginatedSelect";

const CreateProgram = ({ open, onClose, programData }) => {
  const { t } = useTranslation();
  const [languagePage, setLanguagePage] = useState(1);
  const [cityPage, setCityPage] = useState(1);
  const [countryPage, setCountryPage] = useState(1);
  const languageLimit = 10;
  const cityLimit = 10;
  const countryLimit = 10;

  // Cache for storing all loaded data
  const [allLanguages, setAllLanguages] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [allCities, setAllCities] = useState([]);

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

  // Cache management effects
  useEffect(() => {
    if (languagesData?.data) {
      setAllLanguages((prev) => {
        const newLanguages = languagesData.data;
        const existingIds = prev.map((l) => l._id);
        const uniqueNewLanguages = newLanguages.filter(
          (l) => !existingIds.includes(l._id),
        );
        return [...prev, ...uniqueNewLanguages];
      });
    }
  }, [languagesData?.data]);

  useEffect(() => {
    if (countriesData?.data) {
      setAllCountries((prev) => {
        const newCountries = countriesData.data;
        const existingIds = prev.map((c) => c._id);
        const uniqueNewCountries = newCountries.filter(
          (c) => !existingIds.includes(c._id),
        );
        return [...prev, ...uniqueNewCountries];
      });
    }
  }, [countriesData?.data]);

  useEffect(() => {
    if (citiesData?.data) {
      setAllCities((prev) => {
        const newCities = citiesData.data;
        const existingIds = prev.map((c) => c._id);
        const uniqueNewCities = newCities.filter(
          (c) => !existingIds.includes(c._id),
        );
        return [...prev, ...uniqueNewCities];
      });
    }
  }, [citiesData?.data]);

  // Reset cities when country changes
  useEffect(() => {
    setCityPage(1);
    setValue("city", "");
    setAllCities([]); // Clear city cache when country changes
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
    setAllLanguages([]);
    setAllCountries([]);
    setAllCities([]);
    onClose();
  };

  useEffect(() => {
    if (!open || !programData) return;

    // Handle language data for edit mode
    if (programData.language && programData.language.name) {
      setAllLanguages((prev) => {
        const exists = prev.some((l) => l._id === programData.language._id);
        if (!exists) {
          return [...prev, programData.language];
        }
        return prev;
      });
    }

    // Handle country data for edit mode
    if (programData.city?.country && programData.city.country.name) {
      setAllCountries((prev) => {
        const exists = prev.some((c) => c._id === programData.city.country._id);
        if (!exists) {
          return [...prev, programData.city.country];
        }
        return prev;
      });
    }

    // Handle city data for edit mode
    if (programData.city && programData.city.name) {
      setAllCities((prev) => {
        const exists = prev.some((c) => c._id === programData.city._id);
        if (!exists) {
          return [...prev, programData.city];
        }
        return prev;
      });
    }

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
  }, [programData, open, setValue]);

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

  const languages = allLanguages.length > 0 ? allLanguages : languagesData?.data || [];
  const totalLanguages = languagesData?.total_count || 0;

  const countries = allCountries.length > 0 ? allCountries : countriesData?.data || [];
  const totalCountries = countriesData?.total_count || 0;

  const cities = allCities.length > 0 ? allCities : citiesData?.data || [];
  const totalCities = citiesData?.total_count || 0;

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

            <PaginatedSelect
              label={t("programManagement.modal.languageLabel")}
              placeholder={t("programManagement.modal.languagePlaceholder")}
              items={languages}
              value={selectedLanguage || ""}
              onChange={(value) => setValue("language", value, { shouldValidate: true })}
              page={languagePage}
              setPage={setLanguagePage}
              total={totalLanguages}
              limit={languageLimit}
              error={errors.language?.message}
              required
            />

            <PaginatedSelect
              label={t("programManagement.modal.countryLabel")}
              placeholder={t("programManagement.modal.countryPlaceholder")}
              items={countries}
              value={selectedCountry || ""}
              onChange={(value) => {
                setValue("country", value, { shouldValidate: true });
                setValue("city", ""); // Reset city when country changes
              }}
              page={countryPage}
              setPage={setCountryPage}
              total={totalCountries}
              limit={countryLimit}
              error={errors.country?.message}
              required
            />

            <PaginatedSelect
              label={t("programManagement.modal.cityLabel")}
              placeholder={selectedCountry ? t("programManagement.modal.cityPlaceholder") : t("programManagement.modal.cityPlaceholderDisabled")}
              items={cities}
              value={selectedCity || ""}
              onChange={(value) => setValue("city", value, { shouldValidate: true })}
              page={cityPage}
              setPage={setCityPage}
              total={totalCities}
              limit={cityLimit}
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
