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
import { useCreatePlanning, useUpdatePlanning, useGetPlanning } from "@/store/usePlanningStore";
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
      venue_address: "",
      description: "",
      teachers: [],
      assistants: [],
      trainees: [],
      sessions: [
        {
          name: `${t("planningManagement.calendar.session")} 1`,
          session_date: "",
          start_time: "",
          end_time: "",
          teachers: [],
          assistants: [],
          trainees: [],
        },
      ],
      exams: [],
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

  const programsRaw = programsData?.data || [];
  const programs = programsRaw.map((program) => ({
    _id: program._id,
    name: `${program.name} - ${program.city?.name || "N/A"} - ${program.language?.name || "N/A"}`,
    city: program.city,
    language: program.language,
  }));
  const selectedProgramData = programsRaw.find((p) => p._id === selectedProgram);
  const selectedLanguageId = selectedProgramData?.language?._id || "";

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

  const selectedComponent = watch("component");
  const selectedBatch = watch("batch");
  const initialComponentId = planningData?.component?._id || planningData?.component || "";
  const isComponentChanged = selectedComponent !== initialComponentId;

  // Fetch all active plannings for the selected batch to identify already-planned modules
  const { data: batchPlanningsData } = useGetPlanning(
    { batch: selectedBatch, is_all: "true", status: "active" },
    { enabled: open && !!selectedBatch },
  );

  // Set of component IDs that already have a planning for this batch (excluding the current planning itself if editing)
  const plannedComponentIds = new Set(
    (batchPlanningsData?.data || [])
      .filter((p) => !isEdit || p._id !== planningData?._id)
      .map((p) => p.component?._id || p.component)
      .filter(Boolean)
  );

  const { data: examsData, isLoading: examsLoading } = useGetComponents(
    {
      program: selectedProgram,
      type: "exam",
      linked_module: selectedComponent,
    },
    { enabled: open && !!selectedProgram && !!selectedComponent },
  );

  const examsList = examsData?.data || [];

  useEffect(() => {
    // If exams are still loading from the API, do nothing
    if (examsLoading) return;

    if (open && examsList.length > 0) {
      const currentExams = watch("exams") || [];

      const newExams = examsList.map((examComp) => {
        const existing = currentExams.find((e) => e.component === examComp._id);
        if (existing) return existing;

        // Fallback for edit mode: check if it's in planningData.exams
        if (isEdit && !isComponentChanged) {
          const original = planningData?.exams?.find(
            (ex) => (ex.exam_component?._id || ex.exam_component) === examComp._id
          );
          if (original) {
            return {
              component: examComp._id,
              exam: examComp.linked_exam || original.exam?._id || original.exam || "",
              teacher: original.teacher?._id || original.teacher || "",
              is_sit_at_home: original.is_sit_at_home || false,
              max_attempts: original.max_attempts ?? 2,
              cooldown_days: original.cooldown_days ?? 7,
              deadline: original.deadline ? formatTZ(original.deadline, "YYYY-MM-DD") : "",
            };
          }
        }

        return {
          component: examComp._id,
          exam: examComp.linked_exam,
          teacher: "",
          is_sit_at_home: false,
          max_attempts: 2,
          cooldown_days: 7,
          deadline: "",
        };
      });

      const filteredNewExams = newExams.filter((ne) => examsList.some((el) => el._id === ne.component));
      if (JSON.stringify(currentExams) !== JSON.stringify(filteredNewExams)) {
        setValue("exams", filteredNewExams);
      }
    } else if (open) {
      // Only clear if NOT in edit mode, OR if the component has actually changed
      if (!isEdit || isComponentChanged) {
        const currentExams = watch("exams") || [];
        if (currentExams.length > 0) {
          setValue("exams", []);
        }
      }
    }
  }, [examsList, examsLoading, open, setValue, isEdit, isComponentChanged, planningData]);

  const { data: teachersData, isLoading: teachersLoading } = useGetUsers(
    {
      ...(teacherSearchTerm && { search: teacherSearchTerm }),
      role: "teacher",
      teacher_role: "Teacher",
      ...(selectedLanguageId && { language: selectedLanguageId }),
    },
    { enabled: open },
  );

  const { data: assistantsData, isLoading: assistantsLoading } = useGetUsers(
    {
      ...(assistantSearchTerm && { search: assistantSearchTerm }),
      role: "teacher",
      teacher_role: "Assistant",
      ...(selectedLanguageId && { language: selectedLanguageId }),
    },
    { enabled: open },
  );

  const { data: traineesData, isLoading: traineesLoading } = useGetUsers(
    {
      ...(traineeSearchTerm && { search: traineeSearchTerm }),
      role: "teacher",
      teacher_role: "Trainee",
      ...(selectedLanguageId && { language: selectedLanguageId }),
    },
    { enabled: open },
  );


  const batches = batchesData?.data || [];
  const componentsRaw = componentsData?.data || [];
  const components = componentsRaw.map((comp) => {
    const linkedExams = (comp.linked_exams || []).filter((e) => e.name);
    if (linkedExams.length > 0) {
      const examNames = linkedExams.map((e) => e.name).join(", ");
      return {
        ...comp,
        name: `${comp.name} (Exam: ${examNames})`,
      };
    }
    return comp;
  });
  const teachers = teachersData?.data || [];
  const assistants = assistantsData?.data || [];
  const trainees = traineesData?.data || [];

  // All teaching staff combined (for exam teacher dropdown)
  const allStaff = [
    ...teachers.map((u) => ({ ...u, _role: "Teacher" })),
    ...assistants.map((u) => ({ ...u, _role: "Assistant" })),
    ...trainees.map((u) => ({ ...u, _role: "Trainee" })),
  ].filter(
    (u, idx, arr) => arr.findIndex((x) => x._id === u._id) === idx
  );

  const getExamTeacherItems = (examComponentId, assignedTeacherValue) => {
    const baseItems = allStaff.map((staff) => ({
      _id: staff._id,
      name: staff.name
        ? `${staff.name} [${staff._role}]`
        : `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim() || "Unknown",
    }));

    if (assignedTeacherValue) {
      const exists = baseItems.some((item) => item._id === assignedTeacherValue);
      if (!exists) {
        const examData = planningData?.exams?.find(
          (ex) => (ex.exam_component?._id || ex.exam_component) === examComponentId
        );
        if (
          examData &&
          examData.teacher &&
          typeof examData.teacher === "object" &&
          examData.teacher._id === assignedTeacherValue
        ) {
          const teacherName = `${examData.teacher.first_name ?? ""} ${examData.teacher.last_name ?? ""}`.trim() || "Unknown";
          baseItems.push({
            _id: assignedTeacherValue,
            name: `${teacherName} [Assigned]`,
          });
        } else {
          baseItems.push({
            _id: assignedTeacherValue,
            name: "Loading/Assigned Teacher...",
          });
        }
      }
    }
    return baseItems;
  };

  const handleClose = () => {
    reset({
      program: "",
      batch: "",
      component: "",
      venue: "",
      venue_address: "",
      description: "",
      teachers: [],
      assistants: [],
      trainees: [],
      sessions: [
        {
          name: `${t("planningManagement.calendar.session")} 1`,
          session_date: "",
          start_time: "",
          end_time: "",
          teachers: [],
          assistants: [],
          trainees: [],
        },
      ],
      exams: [],
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
      const programId = planningData.component?.program?._id || planningData.component?.program || "";
      const batchId = planningData.batch?._id || planningData.batch || "";
      const componentId = planningData.component?._id || planningData.component || "";
      
      const formattedSessions = planningData.sessions?.map((session) => {
        return {
          _id: session._id,
          name: session.name || "",
          session_date: formatTZ(session.session_date, "YYYY-MM-DD"),
          start_time: formatTZ(session.start_time, "HH:mm"),
          end_time: formatTZ(session.end_time, "HH:mm"),
          teachers: session.teachers?.map((t) => {
            const teacher = t.teacher || t;
            return {
              _id: teacher._id,
              name: `${teacher.first_name} ${teacher.last_name}`.trim(),
              status: t.status || "pending",
            };
          }) || [],
          assistants: session.assistants?.map((a) => {
            const assistant = a.assistant || a;
            return {
              _id: assistant._id,
              name: `${assistant.first_name} ${assistant.last_name}`.trim(),
              status: a.status || "pending",
            };
          }) || [],
          trainees: session.trainees?.map((t) => {
            const trainee = t.trainee || t;
            return {
              _id: trainee._id,
              name: `${trainee.first_name} ${trainee.last_name}`.trim(),
              status: t.status || "pending",
            };
          }) || [],
        };
      }) || [];

      const formattedExams = planningData.exams?.map((ex) => ({
        component: ex.exam_component?._id || ex.exam_component || "",
        exam: ex.exam?._id || ex.exam || "",
        teacher: ex.teacher?._id || ex.teacher || "",
        is_sit_at_home: ex.is_sit_at_home || false,
        max_attempts: ex.max_attempts ?? 2,
        cooldown_days: ex.cooldown_days ?? 7,
        deadline: ex.deadline ? formatTZ(ex.deadline, "YYYY-MM-DD") : "",
      })) || [];

      reset({
        program: programId,
        batch: batchId,
        component: componentId,
        venue: planningData.venue || "",
        venue_address: planningData.venue_address || "",
        description: planningData.description || "",
        sessions: formattedSessions,
        exams: formattedExams,
      });

      // Pre-set search terms so the SearchableSelect can show the labels even if items list is loading
      if (planningData.component?.program?.name) {
        setProgramSearchTerm(planningData.component.program.name);
      }
      if (planningData.batch?.name) {
        setBatchSearchTerm(planningData.batch.name);
      }
      if (planningData.component?.name) {
        setComponentSearchTerm(planningData.component.name);
      }
    }
  }, [planningData, isEdit, reset, open]);



  useEffect(() => {
    if (selectedProgram && !isEdit) {
      setValue("batch", "");
      setValue("component", "");
      setBatchSearchTerm("");
      setComponentSearchTerm("");
    }
  }, [selectedProgram, setValue, isEdit]);

  const onSubmit = (formData) => {
    console.log("[Planning onSubmit] formData:", formData);

    const formattedSessions = formData.sessions.map((session) => {
      const sessionDate = moment(session.session_date).format("YYYY-MM-DD");
      const startTime = moment(session.start_time, "HH:mm").format("HH:mm");
      const endTime = moment(session.end_time, "HH:mm").format("HH:mm");

      let sessionTeachers = [];
      let sessionAssistants = [];
      let sessionTrainees = [];

      if (isEdit) {
        sessionTeachers = (session.teachers || []).map((teacher) => ({
          teacher: teacher._id,
          status: teacher.status || "pending",
        }));
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
      ...(formData.venue_address && { venue_address: formData.venue_address }),
      ...(formData.description && { description: formData.description }),
      sessions: formattedSessions,
      exams: (formData.exams || []).map((ex) => ({
        component: ex.component,
        exam: ex.exam,
        teacher: ex.teacher || null,
        // Ensure boolean — checkbox via register() may return string
        is_sit_at_home: ex.is_sit_at_home === true || ex.is_sit_at_home === "true",
        max_attempts: Number(ex.max_attempts) || 2,
        cooldown_days: Number(ex.cooldown_days) ?? 7,
        deadline: ex.deadline || null,
      })),
    };

    console.log("[Planning onSubmit] payload:", payload);

    const mutation = isEdit ? updatePlanning : createPlanning;
    const mutationData = isEdit
      ? { id: planningData._id, data: payload }
      : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        console.log("[Planning onSubmit] SUCCESS");
        handleClose();
      },
      onError: (err) => {
        console.error("[Planning onSubmit] ERROR:", err);
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
      name: `${t("planningManagement.calendar.session")} ${sessionNumber}`,
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

  const isSubmitting = updatePlanning.isPending || createPlanning.isPending;



  if (!open) return null;

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
          <form
            onSubmit={handleSubmit(onSubmit, (validationErrors) => {
              console.error("[Planning] Zod validation errors (form NOT submitted):", validationErrors);
            })}
            className="space-y-6"
          >
            <SearchableSelect
              label={t("planningManagement.modal.programLabel")}
              placeholder={t("planningManagement.modal.searchPrograms")}
              searchPlaceholder={t("planningManagement.modal.searchPrograms")}
              items={programs}
              value={watch("program")}
              onChange={(value) => {
                if (value) setValue("program", value);
              }}
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
              onChange={(value) => {
                if (value) setValue("batch", value);
              }}
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
              onChange={(value) => {
                if (value) setValue("component", value);
              }}
              onSearch={setComponentSearchTerm}
              isLoading={componentsLoading}
              error={errors.component?.message}
              disabled={!selectedProgram}
              required
              renderItem={(item) => {
                const isPlanned = plannedComponentIds.has(item._id);
                return (
                  <span className="flex items-center justify-between w-full gap-2">
                    <span className="flex-1 truncate">{item.name}</span>
                    {isPlanned && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: "9999px",
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          border: "1px solid #bbf7d0",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        ✓ Planned
                      </span>
                    )}
                  </span>
                );
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormField
                  label={t("planningManagement.modal.venueLabel")}
                  placeholder={t("planningManagement.modal.venuePlaceholder")}
                  error={errors.venue?.message}
                  required
                  {...register("venue")}
                />
              </div>
              <div className="space-y-2">
                <FormField
                  label={t("planningManagement.modal.venueAddress", "Venue Address")}
                  placeholder={t("planningManagement.modal.venueAddressPlaceholder", "Enter full address")}
                  error={errors.venue_address?.message}
                  {...register("venue_address")}
                />
              </div>
            </div>

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
                      ?.city?.venue?.map((venueObj, index) => {
                        const venueName = typeof venueObj === 'string' ? venueObj : venueObj.name;
                        const venueAddress = typeof venueObj === 'string' ? '' : (venueObj.address || '');
                        return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setValue("venue", venueName);
                            setValue("venue_address", venueAddress);
                          }}
                          className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs mr-2 mb-1"
                        >
                          {venueName}
                        </button>
                      )})}
                  </div>
                </div>
              )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("planningManagement.modal.descriptionLabel")}
              </Label>
              <Textarea
                placeholder={t(
                  "planningManagement.modal.descriptionPlaceholder",
                )}
                {...register("description")}
                className="min-h-25"
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
                          className="dark:scheme-dark"
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
                          className="dark:scheme-dark"
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
                        {(() => {
                          const selectedTeachers = watch(`sessions.${index}.teachers`) || [];
                          return (
                            <SearchableMultiSelect
                              label={t("planningManagement.modal.teachersLabel")}
                              placeholder={t(
                                "planningManagement.modal.teachersPlaceholder",
                              )}
                              searchPlaceholder={t(
                                "planningManagement.modal.searchTeachers",
                              )}
                              items={teachers}
                              selected={selectedTeachers}
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
                          );
                        })()}

                        {(() => {
                          const selectedAssistants = watch(`sessions.${index}.assistants`) || [];
                          return (
                            <SearchableMultiSelect
                              label={t("planningManagement.modal.assistantsLabel")}
                              placeholder={t(
                                "planningManagement.modal.assistantsPlaceholder",
                              )}
                              searchPlaceholder={t(
                                "planningManagement.modal.searchAssistants",
                              )}
                              items={assistants}
                              selected={selectedAssistants}
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
                          );
                        })()}

                        {(() => {
                          const selectedTrainees = watch(`sessions.${index}.trainees`) || [];
                          return (
                            <SearchableMultiSelect
                              label={t("planningManagement.modal.traineesLabel")}
                              placeholder={t(
                                "planningManagement.modal.traineesPlaceholder",
                              )}
                              searchPlaceholder={t(
                                "planningManagement.modal.searchTrainees",
                              )}
                              items={trainees}
                              selected={selectedTrainees}
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
                          );
                        })()}
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
            {/* Planned Exams Section */}
            {watch("exams") && watch("exams").length > 0 && (
              <div className="space-y-4 border-t dark:border-white/20 pt-4">
                <Label className="text-base font-semibold">
                  {t("planningManagement.modal.examsLabel", "Exams")}
                </Label>
                
                {watch("exams").map((exam, index) => {
                  const examComponent = examsList.find((e) => e._id === exam.component);
                  const examName = examComponent?.name || t("planningManagement.modal.examLabel", "Exam");

                  return (
                    <div
                      key={exam.component}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50"
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white border-b dark:border-white/10 pb-2">
                        {examName}
                      </h4>

                      <div>
                        {(() => {
                          const teacherVal = watch(`exams.${index}.teacher`);
                          const teacherItems = getExamTeacherItems(exam.component, teacherVal);
                          return (
                            <SearchableSelect
                              label={t("planningManagement.modal.examTeacherLabel", "Exam Teacher")}
                              placeholder={t("planningManagement.modal.selectExamTeacher", "Select exam teacher")}
                              searchPlaceholder={t("planningManagement.modal.searchTeachers")}
                              items={teacherItems}
                              value={teacherVal}
                              onChange={(value) => {
                                setValue(`exams.${index}.teacher`, value);
                              }}
                              onSearch={setTeacherSearchTerm}
                              isLoading={teachersLoading || assistantsLoading || traineesLoading}
                              error={errors.exams?.[index]?.teacher?.message}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
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
