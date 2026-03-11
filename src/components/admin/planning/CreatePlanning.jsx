import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCreatePlanning, useUpdatePlanning } from "@/store/usePlanningStore";
import {
  useGetBatches,
  useGetComponents,
  useGetAllPrograms,
  useGetUsers,
} from "@/store/useDropdownStore";
import { planningSchema } from "@/validations/admin";
import { formatTZ, getMoment } from "@/utils/dateUtils";
import moment from "moment";

const CreatePlanning = ({ open, onClose, planningData, activeCity }) => {
  const { t } = useTranslation();
  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [assistantSearchTerm, setAssistantSearchTerm] = useState("");
  const [traineeSearchTerm, setTraineeSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(planningSchema),
    defaultValues: {
      program: "",
      batch: "",
      component: "",
      venue: "",
      description: "",
      teachers: [],
      assistants: [],
      trainees: [],
      sessions: [
        {
          name: "Session 1",
          session_date: "",
          start_time: "",
          end_time: "",
          teachers: [],
          assistants: [],
          trainees: [],
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
      ...(activeCity && activeCity !== "all" && { city: activeCity }),
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
      teacher_role: "Teacher",
    },
    { enabled: open },
  );

  const { data: assistantsData, isLoading: assistantsLoading } = useGetUsers(
    {
      ...(assistantSearchTerm && { search: assistantSearchTerm }),
      role: "teacher",
      teacher_role: "Assistant",
    },
    { enabled: open },
  );

  const { data: traineesData, isLoading: traineesLoading } = useGetUsers(
    {
      ...(traineeSearchTerm && { search: traineeSearchTerm }),
      role: "teacher",
      teacher_role: "Trainee",
    },
    { enabled: open },
  );

  const programsRaw = programsData?.data || [];
  const programs = programsRaw.map((program) => ({
    _id: program._id,
    name: `${program.name} - ${program.city?.name || "N/A"} - ${program.language?.name || "N/A"}`,
    city: program.city,
  }));
  const batches = batchesData?.data || [];
  const components = componentsData?.data || [];
  const teachers = teachersData?.data || [];
  const assistants = assistantsData?.data || [];
  const trainees = traineesData?.data || [];

  const handleClose = () => {
    reset({
      program: "",
      batch: "",
      component: "",
      venue: "",
      description: "",
      teachers: [],
      assistants: [],
      trainees: [],
      sessions: [
        {
          name: "Session 1",
          session_date: "",
          start_time: "",
          end_time: "",
          teachers: [],
          assistants: [],
          trainees: [],
        },
      ],
    });
    setProgramSearchTerm("");
    setBatchSearchTerm("");
    setComponentSearchTerm("");
    setTeacherSearchTerm("");
    setAssistantSearchTerm("");
    setTraineeSearchTerm("");
    onClose();
  };

  useEffect(() => {
    if (planningData && isEdit && open) {
      const programId = planningData.component?.program?._id || "";

      setValue("program", programId);
      setValue("batch", planningData.batch?._id || "");
      setValue("component", planningData.component?._id || "");
      setValue("venue", planningData.venue || "");
      setValue("description", planningData.description || "");

      if (planningData.sessions && planningData.sessions.length > 0) {
        const formattedSessions = planningData.sessions.map((session) => {
          return {
            _id: session._id,
            name: session.name || "",
            session_date: formatTZ(session.session_date, "YYYY-MM-DD"),
            start_time: formatTZ(session.start_time, "HH:mm"),
            end_time: formatTZ(session.end_time, "HH:mm"),
            teachers: session.teachers
              ? session.teachers.map((t) => {
                  const teacher = t.teacher || t;
                  const teacherData = {
                    _id: teacher._id,
                    name: `${teacher.first_name} ${teacher.last_name}`.trim(),
                    status: t.status || "pending",
                  };
                  return teacherData;
                })
              : [],
            assistants: session.assistants
              ? session.assistants.map((a) => {
                  const assistant = a.assistant || a;
                  return {
                    _id: assistant._id,
                    name: `${assistant.first_name} ${assistant.last_name}`.trim(),
                    status: a.status || "pending",
                  };
                })
              : [],
            trainees: session.trainees
              ? session.trainees.map((t) => {
                  const trainee = t.trainee || t;
                  return {
                    _id: trainee._id,
                    name: `${trainee.first_name} ${trainee.last_name}`.trim(),
                    status: t.status || "pending",
                  };
                })
              : [],
          };
        });
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
    const formattedSessions = formData.sessions.map((session) => {
      const sessionDate = moment(session.session_date).format("YYYY-MM-DD");
      const startTime = moment(session.start_time, "HH:mm").format("HH:mm");
      const endTime = moment(session.end_time, "HH:mm").format("HH:mm");

      let sessionTeachers = [];
      let sessionAssistants = [];
      let sessionTrainees = [];

      if (isEdit) {
        sessionTeachers = (session.teachers || []).map((teacher) => {
          const formatted = {
            teacher: teacher._id,
            status: teacher.status || "pending",
          };
          return formatted;
        });
        sessionAssistants = (session.assistants || []).map((assistant) => ({
          assistant: assistant._id,
          status: assistant.status || "pending",
        }));
        sessionTrainees = (session.trainees || []).map((trainee) => ({
          trainee: trainee._id,
          status: trainee.status || "pending",
        }));
      } else {
        sessionTeachers = (formData.teachers || []).map((teacher) => ({
          teacher: teacher._id,
        }));
        sessionAssistants = (formData.assistants || []).map((assistant) => ({
          assistant: assistant._id,
        }));
        sessionTrainees = (formData.trainees || []).map((trainee) => ({
          trainee: trainee._id,
        }));
      }

      return {
        ...(session._id && { _id: session._id }),
        name: session.name || "",
        session_date: sessionDate,
        start_time: startTime,
        end_time: endTime,
        teachers: sessionTeachers,
        assistants: sessionAssistants,
        trainees: sessionTrainees,
      };
    });

    const payload = {
      batch: formData.batch,
      component: formData.component,
      venue: formData.venue,
      ...(formData.description && { description: formData.description }),
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

  const getDefaultSessionDate = (index) => {
    if (index === 0) return "";

    const previousSessionDate = watch(`sessions.${index - 1}.session_date`);
    if (previousSessionDate) {
      const nextDate = getMoment(previousSessionDate).add(1, "day");
      return nextDate.format("YYYY-MM-DD");
    }
    return "";
  };

  const addSession = () => {
    const sessionNumber = fields.length + 1;

    let defaultDate = "";
    if (fields.length > 0) {
      const previousSessionDate = watch(
        `sessions.${fields.length - 1}.session_date`,
      );
      if (previousSessionDate) {
        const nextDate = getMoment(previousSessionDate).add(1, "day");
        defaultDate = nextDate.format("YYYY-MM-DD");
      }
    }

    append({
      name: `Session ${sessionNumber}`,
      session_date: defaultDate,
      start_time: "",
      end_time: "",
      teachers: [],
      assistants: [],
      trainees: [],
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
          <div className="flex items-start justify-between">
            <div>
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
            <SearchableSelect
              label={t("planningManagement.modal.programLabel")}
              placeholder={t("planningManagement.modal.searchPrograms")}
              searchPlaceholder={t("planningManagement.modal.searchPrograms")}
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
              searchPlaceholder={t("planningManagement.modal.searchBatches")}
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
              label={t("planningManagement.modal.moduleLabel")}
              placeholder={t("planningManagement.modal.modulePlaceholder")}
              searchPlaceholder={t("planningManagement.modal.searchComponents")}
              items={components}
              value={watch("component")}
              onChange={(value) => setValue("component", value)}
              onSearch={setComponentSearchTerm}
              isLoading={componentsLoading}
              error={errors.component?.message}
              disabled={!selectedProgram}
              required
            />

            <div className="space-y-2">
              <FormField
                label={t("planningManagement.modal.venueLabel")}
                placeholder={t("planningManagement.modal.venuePlaceholder")}
                error={errors.venue?.message}
                required
                {...register("venue")}
              />
              {/* Preferred Venues */}
              {selectedProgram &&
                programs.find((p) => p._id === selectedProgram)?.city?.venue
                  ?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">
                      {t("planningManagement.modal.preferredVenues")}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {programs
                        .find((p) => p._id === selectedProgram)
                        ?.city?.venue?.map((venue, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setValue("venue", venue)}
                            className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs mr-2 mb-1"
                          >
                            {venue}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("planningManagement.modal.descriptionLabel")}
              </Label>
              <Textarea
                placeholder={t(
                  "planningManagement.modal.descriptionPlaceholder",
                )}
                {...register("description")}
                className="min-h-[100px]"
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

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
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Hidden field to preserve session _id */}
                    <input
                      type="hidden"
                      {...register(`sessions.${index}._id`)}
                    />

                    <div>
                      <Label className="text-sm font-medium">
                        {t("planningManagement.modal.sessionNameLabel")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder={t(
                          "planningManagement.modal.sessionNamePlaceholder",
                        )}
                        defaultValue={`Session ${index + 1}`}
                        {...register(`sessions.${index}.name`)}
                      />
                      {errors.sessions?.[index]?.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.sessions[index].name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        {t("planningManagement.modal.dateLabel")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        defaultValue={getDefaultSessionDate(index)}
                        {...register(`sessions.${index}.session_date`)}
                      />
                      {errors.sessions?.[index]?.session_date && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.sessions[index].session_date.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {t("planningManagement.modal.timeFromLabel")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="time"
                          className="dark:[color-scheme:dark]"
                          {...register(`sessions.${index}.start_time`)}
                        />
                        {errors.sessions?.[index]?.start_time && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.sessions[index].start_time.message}
                          </p>
                        )}
                        {/* Preferred Start Times */}
                        {selectedProgram &&
                          programs.find((p) => p._id === selectedProgram)?.city
                            ?.times?.length > 0 && (
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600 dark:text-gray-400">
                                {t("planningManagement.modal.preferredTimes")}
                              </Label>
                              <div className="flex flex-wrap gap-1">
                                {programs
                                  .find((p) => p._id === selectedProgram)
                                  ?.city?.times?.map((time, timeIndex) => (
                                    <button
                                      key={timeIndex}
                                      type="button"
                                      onClick={() =>
                                        setValue(
                                          `sessions.${index}.start_time`,
                                          time.start,
                                        )
                                      }
                                      className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs mr-2 mb-1"
                                    >
                                      {time.start}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {t("planningManagement.modal.timeTillLabel")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="time"
                          className="dark:[color-scheme:dark]"
                          {...register(`sessions.${index}.end_time`)}
                        />
                        {errors.sessions?.[index]?.end_time && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.sessions[index].end_time.message}
                          </p>
                        )}
                        {/* Preferred End Times */}
                        {selectedProgram &&
                          programs.find((p) => p._id === selectedProgram)?.city
                            ?.times?.length > 0 && (
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600 dark:text-gray-400">
                                {t("planningManagement.modal.preferredTimes")}
                              </Label>
                              <div className="flex flex-wrap gap-1">
                                {programs
                                  .find((p) => p._id === selectedProgram)
                                  ?.city?.times?.map((time, timeIndex) => (
                                    <button
                                      key={timeIndex}
                                      type="button"
                                      onClick={() =>
                                        setValue(
                                          `sessions.${index}.end_time`,
                                          time.end,
                                        )
                                      }
                                      className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs mr-2 mb-1"
                                    >
                                      {time.end}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Individual Teachers Selection - Only for Edit Mode */}
                    {isEdit && (
                      <>
                        <SearchableMultiSelect
                          label={t("planningManagement.modal.teachersLabel")}
                          placeholder={t(
                            "planningManagement.modal.teachersPlaceholder",
                          )}
                          searchPlaceholder={t(
                            "planningManagement.modal.searchTeachers",
                          )}
                          items={teachers}
                          selected={watch(`sessions.${index}.teachers`) || []}
                          onChange={(selectedTeachers) => {
                            const currentTeachers =
                              watch(`sessions.${index}.teachers`) || [];
                            const teachersWithStatus = selectedTeachers.map(
                              (teacher) => {
                                const existing = currentTeachers.find(
                                  (t) => t._id === teacher._id,
                                );
                                return {
                                  ...teacher,
                                  status: existing?.status || "pending",
                                };
                              },
                            );
                            setValue(
                              `sessions.${index}.teachers`,
                              teachersWithStatus,
                              { shouldValidate: true, shouldDirty: true },
                            );
                          }}
                          onSearch={setTeacherSearchTerm}
                          isLoading={teachersLoading}
                          error={errors.sessions?.[index]?.teachers?.message}
                        />
                        <SearchableMultiSelect
                          label={t("planningManagement.modal.assistantsLabel")}
                          placeholder={t(
                            "planningManagement.modal.assistantsPlaceholder",
                          )}
                          searchPlaceholder={t(
                            "planningManagement.modal.searchAssistants",
                          )}
                          items={assistants}
                          selected={watch(`sessions.${index}.assistants`) || []}
                          onChange={(selectedAssistants) => {
                            const currentAssistants =
                              watch(`sessions.${index}.assistants`) || [];
                            const assistantsWithStatus = selectedAssistants.map(
                              (assistant) => {
                                const existing = currentAssistants.find(
                                  (a) => a._id === assistant._id,
                                );
                                return {
                                  ...assistant,
                                  status: existing?.status || "pending",
                                };
                              },
                            );
                            setValue(
                              `sessions.${index}.assistants`,
                              assistantsWithStatus,
                              { shouldValidate: true, shouldDirty: true },
                            );
                          }}
                          onSearch={setAssistantSearchTerm}
                          isLoading={assistantsLoading}
                          error={errors.sessions?.[index]?.assistants?.message}
                        />
                        <SearchableMultiSelect
                          label={t("planningManagement.modal.traineesLabel")}
                          placeholder={t(
                            "planningManagement.modal.traineesPlaceholder",
                          )}
                          searchPlaceholder={t(
                            "planningManagement.modal.searchTrainees",
                          )}
                          items={trainees}
                          selected={watch(`sessions.${index}.trainees`) || []}
                          onChange={(selectedTrainees) => {
                            const currentTrainees =
                              watch(`sessions.${index}.trainees`) || [];
                            const traineesWithStatus = selectedTrainees.map(
                              (trainee) => {
                                const existing = currentTrainees.find(
                                  (t) => t._id === trainee._id,
                                );
                                return {
                                  ...trainee,
                                  status: existing?.status || "pending",
                                };
                              },
                            );
                            setValue(
                              `sessions.${index}.trainees`,
                              traineesWithStatus,
                              { shouldValidate: true, shouldDirty: true },
                            );
                          }}
                          onSearch={setTraineeSearchTerm}
                          isLoading={traineesLoading}
                          error={errors.sessions?.[index]?.trainees?.message}
                        />
                      </>
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
              <>
                <SearchableMultiSelect
                  label={t("planningManagement.modal.teachersLabel")}
                  placeholder={t(
                    "planningManagement.modal.teachersPlaceholder",
                  )}
                  searchPlaceholder={t(
                    "planningManagement.modal.searchTeachers",
                  )}
                  items={teachers}
                  selected={watch("teachers") || []}
                  onChange={(selectedTeachers) =>
                    setValue("teachers", selectedTeachers)
                  }
                  onSearch={setTeacherSearchTerm}
                  isLoading={teachersLoading}
                  error={errors.teachers?.message}
                />
                <SearchableMultiSelect
                  label={t("planningManagement.modal.assistantsLabel")}
                  placeholder={t(
                    "planningManagement.modal.assistantsPlaceholder",
                  )}
                  searchPlaceholder={t(
                    "planningManagement.modal.searchAssistants",
                  )}
                  items={assistants}
                  selected={watch("assistants") || []}
                  onChange={(selectedAssistants) =>
                    setValue("assistants", selectedAssistants)
                  }
                  onSearch={setAssistantSearchTerm}
                  isLoading={assistantsLoading}
                  error={errors.assistants?.message}
                />
                <SearchableMultiSelect
                  label={t("planningManagement.modal.traineesLabel")}
                  placeholder={t(
                    "planningManagement.modal.traineesPlaceholder",
                  )}
                  searchPlaceholder={t(
                    "planningManagement.modal.searchTrainees",
                  )}
                  items={trainees}
                  selected={watch("trainees") || []}
                  onChange={(selectedTrainees) =>
                    setValue("trainees", selectedTrainees)
                  }
                  onSearch={setTraineeSearchTerm}
                  isLoading={traineesLoading}
                  error={errors.trainees?.message}
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

export default CreatePlanning;
