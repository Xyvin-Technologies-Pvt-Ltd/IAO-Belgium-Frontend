import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";

import { useCreateTeacher, useUpdateTeacher } from "@/store/useTeacherStore";
import { useGetCities } from "@/store/useCityStore";
import { useGetLanguages } from "@/store/useLanguageStore";
import { useGetTitles } from "@/store/useTitleStore";
import { useGetTeacherRole } from "@/store/useTeacherRoleStore";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { teacherSchema } from "@/validations/admin";
import PaginatedMultiSelect from "@/components/ui/forms/PaginationMultiSelect";

const LIMIT = 10;

const CreateTeacher = ({ open, onClose, teacherData }) => {
  const { t } = useTranslation();
  const isEdit = !!teacherData;

  const [cityPage, setCityPage] = useState(1);
  const [languagePage, setLanguagePage] = useState(1);
  const [titlePage, setTitlePage] = useState(1);
  const [rolePage, setRolePage] = useState(1);

  // Cache for storing all loaded data
  const [allCities, setAllCities] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [allTitles, setAllTitles] = useState([]);
  const [allRoles, setAllRoles] = useState([]);

  const { data: citiesData } = useGetCities(
    { page: cityPage, limit: LIMIT },
    { enabled: open },
  );
  const { data: languagesData } = useGetLanguages(
    { page: languagePage, limit: LIMIT },
    { enabled: open },
  );
  const { data: titlesData } = useGetTitles(
    { page: titlePage, limit: LIMIT },
    { enabled: open },
  );
  const { data: rolesData } = useGetTeacherRole(
    { page: rolePage, limit: LIMIT },
    { enabled: open },
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
      location: [],
      language: [],
      academic_degree: "",
      teacher_role: "",
      iao_employment_start_date: "",
    },
  });

  const selectedLocations = watch("location");
  const selectedLanguages = watch("language");

  useEffect(() => {
    if (open) {
      setCityPage(1);
      setLanguagePage(1);
      setTitlePage(1);
      setRolePage(1);
    }
  }, [open]);

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
    if (titlesData?.data) {
      setAllTitles((prev) => {
        const newTitles = titlesData.data;
        const existingIds = prev.map((t) => t._id);
        const uniqueNewTitles = newTitles.filter(
          (t) => !existingIds.includes(t._id),
        );
        return [...prev, ...uniqueNewTitles];
      });
    }
  }, [titlesData?.data]);

  useEffect(() => {
    if (rolesData?.data) {
      setAllRoles((prev) => {
        const newRoles = rolesData.data;
        const existingIds = prev.map((r) => r._id);
        const uniqueNewRoles = newRoles.filter(
          (r) => !existingIds.includes(r._id),
        );
        return [...prev, ...uniqueNewRoles];
      });
    }
  }, [rolesData?.data]);

  useEffect(() => {
    if (!open || !teacherData) return;

    let locationData = [];
    if (Array.isArray(teacherData.location)) {
      locationData = teacherData.location;
      const locationObjects = teacherData.location.filter(
        (l) => l._id && l.name,
      );
      if (locationObjects.length > 0) {
        setAllCities((prev) => {
          const existingIds = prev.map((c) => c._id);
          const uniqueLocations = locationObjects.filter(
            (l) => !existingIds.includes(l._id),
          );
          return [...prev, ...uniqueLocations];
        });
      }
    }

    let languageData = [];
    if (Array.isArray(teacherData.language)) {
      languageData = teacherData.language;
      const languageObjects = teacherData.language.filter(
        (l) => l._id && l.name,
      );
      if (languageObjects.length > 0) {
        setAllLanguages((prev) => {
          const existingIds = prev.map((l) => l._id);
          const uniqueLanguages = languageObjects.filter(
            (l) => !existingIds.includes(l._id),
          );
          return [...prev, ...uniqueLanguages];
        });
      }
    }

    if (teacherData.academic_degree && teacherData.academic_degree.name) {
      setAllTitles((prev) => {
        const exists = prev.some(
          (t) => t._id === teacherData.academic_degree._id,
        );
        if (!exists) {
          return [...prev, teacherData.academic_degree];
        }
        return prev;
      });
    }

    if (teacherData.teacher_role && teacherData.teacher_role.name) {
      setAllRoles((prev) => {
        const exists = prev.some((r) => r._id === teacherData.teacher_role._id);
        if (!exists) {
          return [...prev, teacherData.teacher_role];
        }
        return prev;
      });
    }

    reset({
      first_name: teacherData.first_name || "",
      last_name: teacherData.last_name || "",
      email: teacherData.email || "",
      phone: teacherData.phone || "",
      academic_degree: teacherData.academic_degree?._id || "",
      teacher_role: teacherData.teacher_role?._id || "",
      iao_employment_start_date:
        teacherData.iao_employment_start_date?.split("T")[0] || "",
      location: locationData,
      language: languageData,
    });
  }, [open, teacherData, reset]);

  const handleClose = () => {
    reset({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      location: [],
      language: [],
      academic_degree: "",
      teacher_role: "",
      iao_employment_start_date: "",
    });
    setCityPage(1);
    setLanguagePage(1);
    setTitlePage(1);
    setRolePage(1);
    onClose();
  };

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
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {isEdit
              ? t("teacherManagement.modal.editTitle")
              : t("teacherManagement.modal.createTitle")}
          </h2>
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

            <PaginatedMultiSelect
              label={t("teacherManagement.modal.locationLabel")}
              placeholder={t("teacherManagement.modal.locationPlaceholder")}
              items={allCities.length > 0 ? allCities : citiesData?.data || []}
              selected={selectedLocations}
              onChange={(val) =>
                setValue("location", val, { shouldValidate: true })
              }
              page={cityPage}
              setPage={setCityPage}
              total={citiesData?.total_count || 0}
              limit={LIMIT}
              error={errors.location?.message}
            />

            <PaginatedMultiSelect
              label={t("teacherManagement.modal.languageLabel")}
              placeholder={t("teacherManagement.modal.languagePlaceholder")}
              items={
                allLanguages.length > 0
                  ? allLanguages
                  : languagesData?.data || []
              }
              selected={selectedLanguages}
              onChange={(val) =>
                setValue("language", val, { shouldValidate: true })
              }
              page={languagePage}
              setPage={setLanguagePage}
              total={languagesData?.total_count || 0}
              limit={LIMIT}
              error={errors.language?.message}
            />

            <div className="space-y-2">
              <Label>
                {t("teacherManagement.modal.academicDegreeLabel")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                key={watch("academic_degree") || "empty-degree"}
                value={watch("academic_degree") || ""}
                onValueChange={(v) =>
                  setValue("academic_degree", v, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  className={errors.academic_degree ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={t(
                      "teacherManagement.modal.academicDegreePlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-[var(--radix-select-trigger-width)]"
                >
                  <div className="max-h-[300px] overflow-y-auto">
                    {(allTitles.length > 0
                      ? allTitles
                      : titlesData?.data || []
                    )?.map((title) => (
                      <SelectItem key={title._id} value={title._id}>
                        {title.name}
                      </SelectItem>
                    ))}
                  </div>
                  {(titlesData?.total_count || 0) > LIMIT && (
                    <div className="flex items-center justify-center gap-2 px-2 py-2 border-t bg-background sticky bottom-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setTitlePage((prev) => Math.max(1, prev - 1));
                        }}
                        disabled={titlePage <= 1}
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
                          setTitlePage((prev) => prev + 1);
                        }}
                        disabled={
                          titlePage >=
                          Math.ceil((titlesData?.total_count || 0) / LIMIT)
                        }
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.academic_degree && (
                <p className="text-sm text-red-500">
                  {errors.academic_degree.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                {t("teacherManagement.modal.teacherRoleLabel")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                key={watch("teacher_role") || "empty-role"}
                value={watch("teacher_role") || ""}
                onValueChange={(v) =>
                  setValue("teacher_role", v, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  className={errors.teacher_role ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={t(
                      "teacherManagement.modal.teacherRolePlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-[var(--radix-select-trigger-width)]"
                >
                  <div className="max-h-[300px] overflow-y-auto">
                    {(allRoles.length > 0
                      ? allRoles
                      : rolesData?.data || []
                    )?.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </div>
                  {(rolesData?.total_count || 0) > LIMIT && (
                    <div className="flex items-center justify-center gap-2 px-2 py-2 border-t bg-background sticky bottom-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setRolePage((prev) => Math.max(1, prev - 1));
                        }}
                        disabled={rolePage <= 1}
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
                          setRolePage((prev) => prev + 1);
                        }}
                        disabled={
                          rolePage >=
                          Math.ceil((rolesData?.total_count || 0) / LIMIT)
                        }
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.teacher_role && (
                <p className="text-sm text-red-500">
                  {errors.teacher_role.message}
                </p>
              )}
            </div>

            <FormField
              label={t("teacherManagement.modal.employmentStartDateLabel")}
              type="date"
              {...register("iao_employment_start_date")}
              error={errors.iao_employment_start_date?.message}
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
