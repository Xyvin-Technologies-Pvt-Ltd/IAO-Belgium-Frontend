import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

const CreateProgram = ({ open, onClose, programData }) => {
  const { t } = useTranslation();
  const [languagePage, setLanguagePage] = useState(1);
  const [cityPage, setCityPage] = useState(1);
  const [countryPage, setCountryPage] = useState(1);
  const [allLanguages, setAllLanguages] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [allCountries, setAllCountries] = useState([]);

  const { data: countriesData, isFetching: isFetchingCountries } = useGetCountries({ 
    page_no: countryPage, 
    limit: 20 
  }, { enabled: open });
  const { data: languagesData, isFetching: isFetchingLanguages } = useGetLanguages({ 
    page_no: languagePage, 
    limit: 20 
  }, { enabled: open });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
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
  const selectedYear = watch("year");
  const selectedLanguage = watch("language");
  const selectedCity = watch("city");

  const { data: citiesData, isFetching: isFetchingCities } = useGetCities({
    page_no: cityPage,
    limit: 20,
    ...(selectedCountry ? { country: selectedCountry } : {}),
  }, { enabled: open && !!selectedCountry });

  // Accumulate languages as new pages load
  useEffect(() => {
    if (languagesData?.data) {
      setAllLanguages(prev => {
        const existingIds = new Set(prev.map(l => l._id));
        const newLanguages = languagesData.data.filter(l => !existingIds.has(l._id));
        return [...prev, ...newLanguages];
      });
    }
  }, [languagesData]);

  // Accumulate countries as new pages load
  useEffect(() => {
    if (countriesData?.data) {
      setAllCountries(prev => {
        const existingIds = new Set(prev.map(c => c._id));
        const newCountries = countriesData.data.filter(c => !existingIds.has(c._id));
        return [...prev, ...newCountries];
      });
    }
  }, [countriesData]);

  // Accumulate cities as new pages load
  useEffect(() => {
    if (citiesData?.data) {
      setAllCities(prev => {
        const existingIds = new Set(prev.map(c => c._id));
        const newCities = citiesData.data.filter(c => !existingIds.has(c._id));
        return [...prev, ...newCities];
      });
    }
  }, [citiesData]);

  // Reset cities when country changes
  useEffect(() => {
    setAllCities([]);
    setCityPage(1);
  }, [selectedCountry]);

  // Reset pagination when modal opens
  useEffect(() => {
    if (open) {
      setLanguagePage(1);
      setCityPage(1);
      setCountryPage(1);
      setAllLanguages([]);
      setAllCities([]);
      setAllCountries([]);
    }
  }, [open]);

  const handleClose = () => {
    reset();
    setLanguagePage(1);
    setCityPage(1);
    setCountryPage(1);
    setAllLanguages([]);
    setAllCities([]);
    setAllCountries([]);
    onClose();
  };

  useEffect(() => {
    if (programData && isEdit && open) {
      setValue('name', programData.name || '');
      setValue('description', programData.description || '');
      setValue('program_type', programData.program_type || '');
      setValue('year', programData.year || '');
      setValue('language', programData.language?._id || '');
      setValue('city', programData.city?._id || '');
      setValue('country', programData.city?.country?._id || '');

      // Add the selected items to the accumulated arrays if they exist
      if (programData.language) {
        setAllLanguages(prev => {
          const exists = prev.some(l => l._id === programData.language._id);
          return exists ? prev : [programData.language, ...prev];
        });
      }

      if (programData.city?.country) {
        setAllCountries(prev => {
          const exists = prev.some(c => c._id === programData.city.country._id);
          return exists ? prev : [programData.city.country, ...prev];
        });
      }

      if (programData.city) {
        setAllCities(prev => {
          const exists = prev.some(c => c._id === programData.city._id);
          return exists ? prev : [programData.city, ...prev];
        });
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
              {...register("name", { required: t("programManagement.modal.nameRequired") })}
            />

            <div className="space-y-2">
              <Label>{t("programManagement.modal.descriptionLabel")} <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder={t("programManagement.modal.descriptionPlaceholder")}
                className="bg-white dark:bg-white/5"
                {...register("description", { required: t("programManagement.modal.descriptionRequired") })}
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
                onValueChange={(value) => setValue("program_type", value)}
              >
                <SelectTrigger whiteBg>
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
              {...register("year", { 
                required: t("programManagement.modal.yearRequired"),
                min: { value: 1, message: "Year must be at least 1" },
                max: { value: 10, message: "Year must be at most 10" }
              })}
            />

            <div className="space-y-2">
              <Label>{t("programManagement.modal.languageLabel")} <span className="text-red-500">*</span></Label>
              <Select
                key={selectedLanguage || 'empty-language'}
                value={selectedLanguage || ""}
                onValueChange={(value) => setValue("language", value)}
              >
                <SelectTrigger whiteBg>
                  <SelectValue placeholder={t("programManagement.modal.languagePlaceholder")} />
                </SelectTrigger>
                <SelectContent
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                    if (bottom && !isFetchingLanguages && allLanguages.length < (languagesData?.total_count || 0)) {
                      setLanguagePage(prev => prev + 1);
                    }
                  }}
                >
                  {allLanguages?.map((language) => (
                    <SelectItem key={language._id} value={language._id}>
                      {language.name}
                    </SelectItem>
                  ))}
                  {isFetchingLanguages && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      Loading...
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
                  setValue("country", value);
                  setValue("city", ""); // Reset city when country changes
                }}
              >
                <SelectTrigger whiteBg>
                  <SelectValue placeholder={t("programManagement.modal.countryPlaceholder")} />
                </SelectTrigger>
                <SelectContent
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                    if (bottom && !isFetchingCountries && allCountries.length < (countriesData?.total_count || 0)) {
                      setCountryPage(prev => prev + 1);
                    }
                  }}
                >
                  {allCountries?.map((country) => (
                    <SelectItem key={country._id} value={country._id}>
                      {country.name}
                    </SelectItem>
                  ))}
                  {isFetchingCountries && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      Loading...
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
                onValueChange={(value) => setValue("city", value)}
                disabled={!selectedCountry}
              >
                <SelectTrigger whiteBg>
                  <SelectValue placeholder={selectedCountry ? t("programManagement.modal.cityPlaceholder") : t("programManagement.modal.cityPlaceholderDisabled")} />
                </SelectTrigger>
                <SelectContent
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                    if (bottom && !isFetchingCities && allCities.length < (citiesData?.total_count || 0)) {
                      setCityPage(prev => prev + 1);
                    }
                  }}
                >
                  {allCities?.map((city) => (
                    <SelectItem key={city._id} value={city._id}>
                      {city.name}
                    </SelectItem>
                  ))}
                  {isFetchingCities && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      Loading...
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
