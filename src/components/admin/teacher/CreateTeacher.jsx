import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import FormField from "@/components/ui/forms/FormField";
import { PhoneInput } from "@/components/ui/phone-input";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { Label } from "@/components/ui/label";
import { GetCountries } from "react-country-state-city";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const [countries, setCountries] = useState([]);
  const [preferredCitySearchTerm, setPreferredCitySearchTerm] = useState("");
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");
  const [titleSearchTerm, setTitleSearchTerm] = useState("");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");

  useEffect(() => {
    GetCountries().then((result) => {
      setCountries(result);
    });
  }, []);

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
    control,
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
      address: "",
      postal_code: "",
      country: "",
      city: "",
      location: [],
      language: [],
      academic_degree: "",
      teacher_role: "",
      iao_employment_start_date: "",
    },
  });

  const selectedLanguages = watch("language");
  const selectedLocations = watch("location");

  // Filter Teaching Cities based on Selected Languages
  const selectedLanguageIds = selectedLanguages?.map(l => l._id).join(",");
  const { data: preferredCitiesData, isLoading: preferredCitiesLoading } = useGetAllCities(
    {
      ...(preferredCitySearchTerm && { search: preferredCitySearchTerm }),
      ...(selectedLanguageIds && { language: selectedLanguageIds }),
    },
    { enabled: open && !!selectedLanguageIds },
  );

  const handleClose = () => {
    reset({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      postal_code: "",
      country: "",
      city: "",
      location: [],
      language: [],
      academic_degree: "",
      teacher_role: "",
      iao_employment_start_date: "",
    });
    setPreferredCitySearchTerm("");
    setLanguageSearchTerm("");
    setTitleSearchTerm("");
    setRoleSearchTerm("");
    onClose();
  };

  useEffect(() => {
    if (!open || !teacherData) return;

    const academicDegreeId = teacherData.academic_degree?._id || teacherData.academic_degree || "";
    const teacherRoleId = teacherData.teacher_role?._id || teacherData.teacher_role || "";

    reset({
      first_name: teacherData.first_name || "",
      last_name: teacherData.last_name || "",
      email: teacherData.email || "",
      phone: teacherData.phone || "",
      address: teacherData.address || "",
      postal_code: teacherData.postal_code || "",
      country: teacherData.country || "",
      city: teacherData.city || "",
      academic_degree: academicDegreeId,
      teacher_role: teacherRoleId,
      iao_employment_start_date:
        teacherData.iao_employment_start_date?.split("T")[0] || "",
      location: Array.isArray(teacherData.location) ? teacherData.location : [],
      language: Array.isArray(teacherData.language) ? teacherData.language : [],
    });
  }, [open, teacherData, reset]);

  const onSubmit = (data) => {
    const payload = {
      ...data,
      location: data.location.map((l) => l._id),
      language: data.language.map((l) => l._id),
    };

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
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-l-2 border-gray-300 dark:border-zinc-700 pl-2.5">
                {t("teacherManagement.modal.personalDetails") || "Personal Details"}
              </h3>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label={t("teacherManagement.modal.emailLabel")}
                  placeholder={t("teacherManagement.modal.emailPlaceholder")}
                  {...register("email")}
                  error={errors.email?.message}
                  required
                />
                <FormField
                  label={t("teacherManagement.modal.phoneLabel")}
                  error={errors.phone?.message}
                  required
                >
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <PhoneInput
                        value={value || ""}
                        onChange={onChange}
                        defaultCountry="US"
                        placeholder={t("teacherManagement.modal.phonePlaceholder")}
                        error={errors.phone}
                      />
                    )}
                  />
                </FormField>
              </div>

              <FormField
                label={t("teacherManagement.modal.addressLabel") || "Address"}
                placeholder={t("teacherManagement.modal.addressPlaceholder")}
                {...register("address")}
                error={errors.address?.message}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label={t("teacherManagement.modal.postalCodeLabel") || "Postal Code"}
                  placeholder={t("teacherManagement.modal.postalCodePlaceholder")}
                  {...register("postal_code")}
                  error={errors.postal_code?.message}
                  required
                />
                <FormField
                  label={t("teacherManagement.modal.countryLabel")}
                  required
                  error={errors.country?.message}
                >
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        key={countries.length}
                        onValueChange={(val) => {
                          if (val) {
                            field.onChange(val);
                          }
                        }}
                        value={field.value || ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("teacherManagement.modal.countryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>
              <FormField
                label={t("teacherManagement.modal.cityLabel") || "City"}
                placeholder={t("teacherManagement.modal.cityPlaceholder")}
                {...register("city")}
                error={errors.city?.message}
                required
              />
            </div>

            <div className="py-6">
              <hr className="border-t border-gray-200 dark:border-white/10" />
            </div>

            {/* IAO Teaching Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-l-2 border-gray-300 dark:border-zinc-700 pl-2.5">
                {t("teacherManagement.modal.teachingDetails") || "IAO Teaching Details"}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <SearchableMultiSelect
                      label={t("teacherManagement.modal.languageLabel")}
                      placeholder={t("teacherManagement.modal.languagePlaceholder")}
                      searchPlaceholder={t("common.searchLanguages")}
                      items={languagesData?.data || []}
                      selected={field.value}
                      onChange={field.onChange}
                      onSearch={setLanguageSearchTerm}
                      isLoading={languagesLoading}
                      error={errors.language?.message}
                      required
                    />
                  )}
                />

                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <SearchableMultiSelect
                      label={t("teacherManagement.modal.citiesLabel")}
                      placeholder={
                        selectedLanguageIds
                          ? t("teacherManagement.modal.citiesPlaceholder")
                          : "Select preferred language(s) first"
                      }
                      searchPlaceholder={t("common.searchCities")}
                      items={preferredCitiesData?.data || []}
                      selected={field.value}
                      onChange={field.onChange}
                      onSearch={setPreferredCitySearchTerm}
                      isLoading={preferredCitiesLoading}
                      error={errors.location?.message}
                      disabled={!selectedLanguageIds}
                      required
                    />
                  )}
                />
                {!preferredCitiesLoading && selectedLanguageIds && preferredCitiesData?.data?.length === 0 && (
                  <p className="text-xs text-amber-600 italic">
                    No cities found where the selected language(s) are taught.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Controller
                  name="academic_degree"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      label={t("teacherManagement.modal.academicDegreeLabel")}
                      placeholder={t(
                        "teacherManagement.modal.academicDegreePlaceholder",
                      )}
                      searchPlaceholder={t("common.searchTitles")}
                      items={titlesData?.data || []}
                      value={field.value}
                      onChange={field.onChange}
                      onSearch={setTitleSearchTerm}
                      isLoading={titlesLoading}
                      error={errors.academic_degree?.message}
                      required
                    />
                  )}
                />

                <Controller
                  name="teacher_role"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      label={t("teacherManagement.modal.teacherRoleLabel")}
                      placeholder={t("teacherManagement.modal.teacherRolePlaceholder")}
                      searchPlaceholder={t("common.searchRoles")}
                      items={rolesData?.data || []}
                      value={field.value}
                      onChange={field.onChange}
                      onSearch={setRoleSearchTerm}
                      isLoading={rolesLoading}
                      error={errors.teacher_role?.message}
                      required
                    />
                  )}
                />
              </div>

              <FormField
                label={t("teacherManagement.modal.employmentStartDateLabel")}
                type="date"
                {...register("iao_employment_start_date")}
                error={errors.iao_employment_start_date?.message}
                required
              />
            </div>

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
