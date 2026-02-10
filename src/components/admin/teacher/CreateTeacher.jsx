import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";

import { useCreateTeacher, useUpdateTeacher } from "@/store/useTeacherStore";
import {
  useGetAllCities,
  useGetAllCountries,
  useGetAllLanguages,
  useGetAllTeacherTitle,
  useGetAllTeacherRoles,
} from "@/store/useDropdownStore";

import { teacherSchema } from "@/validations/admin";

const CreateTeacher = ({ open, onClose, teacherData }) => {
  const { t } = useTranslation();
  const isEdit = !!teacherData;

  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");
  const [titleSearchTerm, setTitleSearchTerm] = useState("");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");

  const [selectedCountry, setSelectedCountry] = useState("");

  const { data: countriesData, isLoading: countriesLoading } =
    useGetAllCountries(
      { 
        ...(countrySearchTerm && { search: countrySearchTerm })
      },
      { enabled: open }
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
        ...(languageSearchTerm && { search: languageSearchTerm })
      },
      { enabled: open }
    );
  const { data: titlesData, isLoading: titlesLoading } = useGetAllTeacherTitle(
    { 
      ...(titleSearchTerm && { search: titleSearchTerm })
    },
    { enabled: open }
  );
  const { data: rolesData, isLoading: rolesLoading } = useGetAllTeacherRoles(
    { 
      ...(roleSearchTerm && { search: roleSearchTerm })
    },
    { enabled: open }
  );

  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(teacherSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      country: "",
      location: [],
      language: [],
      academic_degree: "",
      teacher_role: "",
      iao_employment_start_date: "",
    },
  });

  const selectedLocations = watch("location");
  const selectedLanguages = watch("language");
  const watchedCountry = watch("country");

  useEffect(() => {
    if (watchedCountry !== selectedCountry) {
      setSelectedCountry(watchedCountry);
      if (watchedCountry !== selectedCountry && selectedLocations.length > 0) {
        setValue("location", [], { shouldValidate: true });
      }
    }
  }, [watchedCountry, selectedCountry, selectedLocations.length, setValue]);

  const handleClose = () => {
    reset({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      country: "",
      location: [],
      language: [],
      academic_degree: "",
      teacher_role: "",
      iao_employment_start_date: "",
    });
    setCitySearchTerm("");
    setCountrySearchTerm("");
    setLanguageSearchTerm("");
    setTitleSearchTerm("");
    setRoleSearchTerm("");
    setSelectedCountry("");
    onClose();
  };

  useEffect(() => {
    if (!open || !teacherData) return;

    // Extract country from the first location if available
    const countryId = teacherData.country?._id || 
                      (Array.isArray(teacherData.location) && teacherData.location.length > 0 
                        ? teacherData.location[0].country 
                        : "");

    reset({
      first_name: teacherData.first_name || "",
      last_name: teacherData.last_name || "",
      email: teacherData.email || "",
      phone: teacherData.phone || "",
      country: countryId,
      academic_degree: teacherData.academic_degree?._id || "",
      teacher_role: teacherData.teacher_role?._id || "",
      iao_employment_start_date:
        teacherData.iao_employment_start_date?.split("T")[0] || "",
      location: Array.isArray(teacherData.location) ? teacherData.location : [],
      language: Array.isArray(teacherData.language) ? teacherData.language : [],
    });

    if (countryId) {
      setSelectedCountry(countryId);
    }
  }, [open, teacherData, reset]);

  const onSubmit = (data) => {
    const payload = {
      ...data,
      location: data.location.map((l) => l._id),
      language: data.language.map((l) => l._id),
    };

    delete payload.country;

    if (isEdit && teacherData) {
      if (data.email === teacherData.email) {
        delete payload.email;
      }
      if (data.phone === teacherData.phone) {
        delete payload.phone;
      }
    }

    const mutation = isEdit ? updateTeacher : createTeacher;
    const args = isEdit ? { id: teacherData._id, data: payload } : payload;

    mutation.mutate(args, {
      onSuccess: handleClose,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-black border dark:border-white/20 shadow-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit
                  ? t("teacherManagement.modal.editTitle")
                  : t("teacherManagement.modal.createTitle")}
              </h2>
            </div>
            <button 
              onClick={handleClose}
              className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("teacherManagement.modal.firstNameLabel")}
                placeholder={t("teacherManagement.modal.firstNamePlaceholder")}
                {...register("first_name")}
                error={errors.first_name?.message}
                required
              />
              <FormField
                label={t("teacherManagement.modal.lastNameLabel")}
                placeholder={t("teacherManagement.modal.lastNamePlaceholder")}
                {...register("last_name")}
                error={errors.last_name?.message}
                required
              />
            </div>

            <FormField
              label={t("teacherManagement.modal.emailLabel")}
              placeholder={t("teacherManagement.modal.emailPlaceholder")}
              {...register("email")}
              error={errors.email?.message}
              required
            />
            <FormField
              label={t("teacherManagement.modal.phoneLabel")}
              placeholder={t("teacherManagement.modal.phonePlaceholder")}
              {...register("phone")}
              error={errors.phone?.message}
              required
            />

            <SearchableSelect
              label={t("teacherManagement.modal.countryLabel")}
              placeholder={t("teacherManagement.modal.countryPlaceholder")}
              searchPlaceholder="Search countries..."
              items={countriesData?.data || []}
              value={watch("country") || ""}
              onChange={(v) => setValue("country", v, { shouldValidate: true })}
              onSearch={setCountrySearchTerm}
              isLoading={countriesLoading}
              error={errors.country?.message}
              required
            />

            <SearchableMultiSelect
              label={t("teacherManagement.modal.citiesLabel")}
              placeholder={
                selectedCountry
                  ? t("teacherManagement.modal.citiesPlaceholder")
                  : "Please select a country first"
              }
              searchPlaceholder="Search cities..."
              items={citiesData?.data || []}
              selected={selectedLocations}
              onChange={(val) =>
                setValue("location", val, { shouldValidate: true })
              }
              onSearch={setCitySearchTerm}
              isLoading={citiesLoading}
              error={errors.location?.message}
              disabled={!selectedCountry}
            />

            <SearchableMultiSelect
              label={t("teacherManagement.modal.languageLabel")}
              placeholder={t("teacherManagement.modal.languagePlaceholder")}
              searchPlaceholder="Search languages..."
              items={languagesData?.data || []}
              selected={selectedLanguages}
              onChange={(val) =>
                setValue("language", val, { shouldValidate: true })
              }
              onSearch={setLanguageSearchTerm}
              isLoading={languagesLoading}
              error={errors.language?.message}
            />

            <SearchableSelect
              label={t("teacherManagement.modal.academicDegreeLabel")}
              placeholder={t(
                "teacherManagement.modal.academicDegreePlaceholder",
              )}
              searchPlaceholder="Search academic degrees..."
              items={titlesData?.data || []}
              value={watch("academic_degree") || ""}
              onChange={(v) =>
                setValue("academic_degree", v, { shouldValidate: true })
              }
              onSearch={setTitleSearchTerm}
              isLoading={titlesLoading}
              error={errors.academic_degree?.message}
              required
            />

            <SearchableSelect
              label={t("teacherManagement.modal.teacherRoleLabel")}
              placeholder={t("teacherManagement.modal.teacherRolePlaceholder")}
              searchPlaceholder="Search teacher roles..."
              items={rolesData?.data || []}
              value={watch("teacher_role") || ""}
              onChange={(v) =>
                setValue("teacher_role", v, { shouldValidate: true })
              }
              onSearch={setRoleSearchTerm}
              isLoading={rolesLoading}
              error={errors.teacher_role?.message}
              required
            />

            <FormField
              label={t("teacherManagement.modal.employmentStartDateLabel")}
              type="date"
              {...register("iao_employment_start_date")}
              error={errors.iao_employment_start_date?.message}
              required
            />

            <FormActions
              onCancel={handleClose}
              isLoading={createTeacher.isPending || updateTeacher.isPending}
              isEdit={isEdit}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTeacher;
