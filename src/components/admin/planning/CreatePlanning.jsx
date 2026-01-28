import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCreatePlanning, useUpdatePlanning } from "@/store/usePlanningStore";
import {
  useGetBatches,
  useGetComponents,
  useGetAllPrograms,
  useGetUsers,
} from "@/store/useDropdownStore";
import moment from "moment";
const CreatePlanning = ({ open, onClose, planningData }) => {
  const { t } = useTranslation();

  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      program: "",
      batch: "",
      component: "",
      venue: "",
      teachers: [],
      sessions: [
        {
          session_date: "",
          start_time: "",
          end_time: "",
          teachers: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sessions",
  });

  const isEdit = !!planningData;
  const createPlanning = useCreatePlanning();
  const updatePlanning = useUpdatePlanning();

  const selectedProgram = watch("program");

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    {
      ...(programSearchTerm && { search: programSearchTerm }),
    },
    { enabled: open },
  );

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgram,
    {
      ...(batchSearchTerm && { search: batchSearchTerm }),
    },
    { enabled: open && !!selectedProgram },
  );

  const { data: componentsData, isLoading: componentsLoading } =
    useGetComponents(
      {
        ...(componentSearchTerm && { search: componentSearchTerm }),
        program: selectedProgram,
        type: "module",
      },
      { enabled: open && !!selectedProgram },
    );

  const { data: teachersData, isLoading: teachersLoading } = useGetUsers(
    {
      ...(teacherSearchTerm && { search: teacherSearchTerm }),
      role: "teacher",
    },
    { enabled: open },
  );

  const programs = programsData?.data || [];
  const batches = batchesData?.data || [];
  const components = componentsData?.data || [];
  const teachers = teachersData?.data || [];

  const handleClose = () => {
    reset({
      program: "",
      batch: "",
      component: "",
      venue: "",
      teachers: [],
      sessions: [
        {
          session_date: "",
          start_time: "",
          end_time: "",
          teachers: [],
        },
      ],
    });
    setProgramSearchTerm("");
    setBatchSearchTerm("");
    setComponentSearchTerm("");
    setTeacherSearchTerm("");
    onClose();
  };

  useEffect(() => {
    if (planningData && isEdit && open) {
      const programId = planningData.component?.program?._id || "";

      setValue("program", programId);
      setValue("batch", planningData.batch?._id || "");
      setValue("component", planningData.component?._id || "");
      setValue("venue", planningData.venue || "");

      if (planningData.sessions && planningData.sessions.length > 0) {
        const formattedSessions = planningData.sessions.map((session) => ({
          session_date: session.session_date
            ? moment(session.session_date).format("YYYY-MM-DD")
            : "",
          start_time: session.start_time
            ? moment(session.start_time).format("HH:mm")
            : "",
          end_time: session.end_time
            ? moment(session.end_time).format("HH:mm")
            : "",
          teachers: session.teachers
            ? session.teachers.map((t) => {
                const teacher = t.teacher || t;
                return {
                  _id: teacher._id,
                  name: `${teacher.first_name} ${teacher.last_name}`.trim(),
                };
              })
            : [],
        }));
        setValue("sessions", formattedSessions);
      }
    }
  }, [planningData, isEdit, setValue, open]);

  useEffect(() => {
    if (selectedProgram && !isEdit) {
      setValue("batch", "");
      setValue("component", "");
      setBatchSearchTerm("");
      setComponentSearchTerm("");
    }
  }, [selectedProgram, setValue, isEdit]);

  const onSubmit = (formData) => {
    if (!formData.program) {
      setValue("program", "", { shouldValidate: true });
      return;
    }
    if (!formData.batch) {
      setValue("batch", "", { shouldValidate: true });
      return;
    }
    if (!formData.component) {
      setValue("component", "", { shouldValidate: true });
      return;
    }

    if (!formData.sessions || formData.sessions.length === 0) {
      return;
    }
    const formattedSessions = formData.sessions.map((session) => {
      const sessionDate = moment(session.session_date).format("YYYY-MM-DD");

      const startTime = moment(session.start_time, "HH:mm").format("HH:mm");
      const endTime = moment(session.end_time, "HH:mm").format("HH:mm");

      const sessionTeachers = isEdit
        ? (session.teachers || []).map((teacher) => ({ teacher: teacher._id }))
        : (formData.teachers || []).map((teacher) => ({
            teacher: teacher._id,
          }));

      return {
        session_date: sessionDate,
        start_time: startTime,
        end_time: endTime,
        teachers: sessionTeachers,
      };
    });

    const payload = {
      batch: formData.batch,
      component: formData.component,
      venue: formData.venue,
      sessions: formattedSessions,
    };

    const mutation = isEdit ? updatePlanning : createPlanning;
    const mutationData = isEdit
      ? { id: planningData._id, data: payload }
      : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const addSession = () => {
    append({
      session_date: "",
      start_time: "",
      end_time: "",
      teachers: [],
    });
  };

  const removeSession = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  if (!open) return null;

  const isSubmitting = createPlanning.isPending || updatePlanning.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit
              ? t("planningManagement.modal.editTitle")
              : t("planningManagement.modal.createTitle")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/70">
            {isEdit
              ? t("planningManagement.modal.editSubtitle")
              : t("planningManagement.modal.createSubtitle")}
          </p>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <SearchableSelect
              label={t("planningManagement.modal.programLabel")}
              placeholder={t("planningManagement.modal.programPlaceholder")}
              searchPlaceholder="Search programs..."
              items={programs}
              value={watch("program")}
              onChange={(value) => setValue("program", value)}
              onSearch={setProgramSearchTerm}
              isLoading={programsLoading}
              error={errors.program?.message}
              required
            />

            <SearchableSelect
              label={t("planningManagement.modal.batchLabel")}
              placeholder={t("planningManagement.modal.batchPlaceholder")}
              searchPlaceholder="Search batches..."
              items={batches}
              value={watch("batch")}
              onChange={(value) => setValue("batch", value)}
              onSearch={setBatchSearchTerm}
              isLoading={batchesLoading}
              error={errors.batch?.message}
              disabled={!selectedProgram}
              required
            />

            <SearchableSelect
              label={t("planningManagement.modal.componentLabel")}
              placeholder={t("planningManagement.modal.componentPlaceholder")}
              searchPlaceholder="Search components..."
              items={components}
              value={watch("component")}
              onChange={(value) => setValue("component", value)}
              onSearch={setComponentSearchTerm}
              isLoading={componentsLoading}
              error={errors.component?.message}
              disabled={!selectedProgram}
              required
            />

            <FormField
              label={t("planningManagement.modal.venueLabel")}
              placeholder={t("planningManagement.modal.venuePlaceholder")}
              error={errors.venue?.message}
              required
              {...register("venue", {
                required: t("planningManagement.modal.venueRequired"),
              })}
            />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  {t("planningManagement.modal.sessionsLabel")}
                </Label>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {t("planningManagement.modal.sessionLabel")} {index + 1}
                    </h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSession(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        {t("planningManagement.modal.dateLabel")} *
                      </Label>
                      <Input
                        type="date"
                        {...register(`sessions.${index}.session_date`, {
                          required: t("planningManagement.modal.dateRequired"),
                        })}
                      />
                      {errors.sessions?.[index]?.session_date && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.sessions[index].session_date.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          {t("planningManagement.modal.timeFromLabel")} *
                        </Label>
                        <Input
                          type="time"
                          {...register(`sessions.${index}.start_time`, {
                            required: t(
                              "planningManagement.modal.startTimeRequired",
                            ),
                          })}
                        />
                        {errors.sessions?.[index]?.start_time && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.sessions[index].start_time.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          {t("planningManagement.modal.timeTillLabel")} *
                        </Label>
                        <Input
                          type="time"
                          {...register(`sessions.${index}.end_time`, {
                            required: t(
                              "planningManagement.modal.endTimeRequired",
                            ),
                          })}
                        />
                        {errors.sessions?.[index]?.end_time && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.sessions[index].end_time.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Individual Teachers Selection - Only for Edit Mode */}
                    {isEdit && (
                      <SearchableMultiSelect
                        label={t("planningManagement.modal.teachersLabel")}
                        placeholder={t(
                          "planningManagement.modal.teachersPlaceholder",
                        )}
                        searchPlaceholder="Search teachers..."
                        items={teachers}
                        selected={watch(`sessions.${index}.teachers`) || []}
                        onChange={(selectedTeachers) =>
                          setValue(
                            `sessions.${index}.teachers`,
                            selectedTeachers,
                          )
                        }
                        onSearch={setTeacherSearchTerm}
                        isLoading={teachersLoading}
                        error={errors.sessions?.[index]?.teachers?.message}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={addSession}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t("planningManagement.modal.addSession")}
                </Button>
              </div>
            </div>
            {!isEdit && (
              <SearchableMultiSelect
                label={t("planningManagement.modal.teachersLabel")}
                placeholder={t("planningManagement.modal.teachersPlaceholder")}
                searchPlaceholder="Search teachers..."
                items={teachers}
                selected={watch("teachers") || []}
                onChange={(selectedTeachers) =>
                  setValue("teachers", selectedTeachers)
                }
                onSearch={setTeacherSearchTerm}
                isLoading={teachersLoading}
                error={errors.teachers?.message}
              />
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

export default CreatePlanning;
