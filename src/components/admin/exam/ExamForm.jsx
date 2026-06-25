import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import FormActions from "@/components/ui/forms/FormActions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionSourceSelector from "./QuestionSourceSelector";
import { useCreateExam, useUpdateExam } from "@/store/useExamStore";
import {
  useGetAllLanguages,
  useGetAllPrograms,
  useGetBatches,
  useGetComponents,
  useGetUsers,
} from "@/store/useDropdownStore";
import { examSchema } from "@/validations/admin/exam.validation";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";

const ExamForm = ({ open, onClose, examData, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!examData;

  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      exam_language: "",
      question_sources: [],
      passing_marks: 0,
      passing_percentage: 0,
      passing_type: "percentage",
      duration: 60,
      type: "online",
      program: "",
      batch: "",
      module: "",
      max_attempts: 2,
      cooldown_days: 7,
      deadline: "",
      teachers: [],
    },
  });

  const selectedProgram = watch("program");
  const selectedType = watch("type");

  const { data: languagesData } = useGetAllLanguages({ status: true });
  const languages = languagesData?.data || [];

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    {
      ...(programSearchTerm && { search: programSearchTerm }),
    },
    { enabled: open && (selectedType === "sit-at-home" || selectedType === "practical") },
  );

  const programsRaw = programsData?.data || [];
  const programs = programsRaw.map((program) => ({
    _id: program._id,
    name: `${program.name} - ${program.city?.name || "N/A"} - ${program.language?.name || "N/A"}`,
    city: program.city,
    language: program.language,
  }));

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgram,
    {
      ...(batchSearchTerm && { search: batchSearchTerm }),
    },
    { enabled: open && (selectedType === "sit-at-home" || selectedType === "practical") && !!selectedProgram },
  );

  const batches = (batchesData?.data || []).map((batch) => ({
    _id: batch._id,
    name: batch.name,
  }));

  const { data: modulesData, isLoading: modulesLoading } = useGetComponents(
    {
      type: "module",
      program: selectedProgram,
    },
    { enabled: open && selectedType === "sit-at-home" && !!selectedProgram },
  );

  const modules = (modulesData?.data || []).map((module) => ({
    _id: module._id,
    name: module.name,
  }));

  const { data: teachersRawData, isLoading: teachersLoading } = useGetUsers(
    {
      ...(teacherSearchTerm && { search: teacherSearchTerm }),
      role: "teacher",
    },
    { enabled: open && selectedType === "practical" }
  );

  const rawTeachers = teachersRawData?.data;

  const teachersList = useMemo(() => {
    const map = new Map();

    // 1. Add teachers from examData (initially selected)
    if (examData?.teachers && Array.isArray(examData.teachers)) {
      examData.teachers.forEach((t) => {
        const id = typeof t === "object" ? t?._id : t;
        const name = typeof t === "object"
          ? (t?.name || `${t?.first_name || ""} ${t?.last_name || ""} (${t?.email || ""})`.trim())
          : t;
        if (id) {
          map.set(id.toString(), { _id: id.toString(), name });
        }
      });
    }

    // 2. Add searched teachers from API
    if (rawTeachers && Array.isArray(rawTeachers)) {
      rawTeachers.forEach((u) => {
        if (u?._id) {
          const name = u.name || `${u.first_name || ""} ${u.last_name || ""} (${u.email || ""})`.trim();
          map.set(u._id.toString(), { _id: u._id.toString(), name });
        }
      });
    }

    return Array.from(map.values());
  }, [examData?.teachers, rawTeachers]);

  const selectedTeachersIds = watch("teachers") || [];
  const selectedTeachersObjects = useMemo(() => {
    const selectedSet = new Set(selectedTeachersIds.map(id => id ? id.toString() : ""));
    return teachersList.filter(t => selectedSet.has(t._id));
  }, [teachersList, selectedTeachersIds]);

  const questionSources = watch("question_sources") || [];
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();

  const handleClose = () => {
    reset({
      name: "",
      description: "",
      instructions: "",
      exam_language: "",
      question_sources: [],
      passing_marks: 0,
      passing_percentage: 0,
      passing_type: "percentage",
      duration: 60,
      type: "online",
      program: "",
      batch: "",
      module: "",
      max_attempts: 2,
      cooldown_days: 7,
      deadline: "",
      teachers: [],
    });
    setProgramSearchTerm("");
    setBatchSearchTerm("");
    setTeacherSearchTerm("");
    onClose();
  };

  useEffect(() => {
    if (examData && open) {
      const prog = examData.batch?.intake?.program || examData.module?.program;
      if (prog?.name) {
        setProgramSearchTerm(prog.name);
      }
      reset({
        name: examData.name || "",
        description: examData.description || "",
        instructions: examData.instructions || "",
        exam_language: examData.exam_language?._id || examData.exam_language || "",
        question_sources:
          examData.question_sources?.map((s) => ({
            question_bank:
              typeof s.question_bank === "object"
                ? s.question_bank._id
                : s.question_bank,
            count: s.count || 1,
          })) || [],
        passing_marks: examData.passing_marks ?? 0,
        passing_percentage: examData.passing_percentage ?? 0,
        passing_type: examData.passing_type || "percentage",
        duration: examData.duration ?? 60,
        type: examData.type || "online",
        program: prog?._id || "",
        batch: examData.batch?._id || examData.batch || "",
        module: examData.module?._id || examData.module || "",
        max_attempts: examData.max_attempts ?? 2,
        cooldown_days: examData.cooldown_days ?? 7,
        deadline: examData.deadline ? examData.deadline.split("T")[0] : "",
        teachers: examData.teachers?.map((t) => typeof t === "object" ? t._id : t) || [],
      });
    } else if (!examData && open) {
      reset({
        name: "",
        description: "",
        instructions: "",
        exam_language: "",
        question_sources: [],
        passing_marks: 0,
        passing_percentage: 0,
        passing_type: "percentage",
        duration: 60,
        type: "online",
        program: "",
        batch: "",
        module: "",
        max_attempts: 2,
        cooldown_days: 7,
        deadline: "",
        teachers: [],
      });
      setProgramSearchTerm("");
      setBatchSearchTerm("");
      setTeacherSearchTerm("");
    }
  }, [examData, reset, open]);

  const onSubmit = (values) => {
    const finalValues = { ...values };
    if (values.passing_type === "percentage") {
      delete finalValues.passing_marks;
    } else {
      delete finalValues.passing_percentage;
    }

    if (values.type === "sit-at-home" || values.type === "practical") {
      delete finalValues.program;
      if (values.type === "sit-at-home") {
        finalValues.max_attempts = Number(values.max_attempts) || 2;
        finalValues.cooldown_days = Number(values.cooldown_days) ?? 7;
        finalValues.deadline = values.deadline || null;
        finalValues.teachers = [];
      } else {
        delete finalValues.max_attempts;
        delete finalValues.cooldown_days;
        delete finalValues.deadline;
        finalValues.question_sources = [];
        finalValues.exam_language = null;
        finalValues.teachers = values.teachers || [];
      }
      finalValues.batch = values.batch || null;
      finalValues.module = values.module || null;
    } else {
      delete finalValues.program;
      delete finalValues.batch;
      delete finalValues.module;
      delete finalValues.max_attempts;
      delete finalValues.cooldown_days;
      delete finalValues.deadline;
      delete finalValues.teachers;
    }

    const mutation = isEdit ? updateExam : createExam;
    const mutationData = isEdit
      ? { id: examData._id, data: finalValues }
      : finalValues;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createExam.isPending || updateExam.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit ? t("exam.editExam") : t("exam.createExam")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/70">
                {isEdit
                  ? t("exam.editSubtitle")
                  : t("exam.createSubtitle")}
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.type", "Exam Type")}
              </Label>
              <Select
                key={`type-${watch("type")}`}
                value={watch("type") || "online"}
                onValueChange={(v) => {
                  setValue("type", v, { shouldValidate: true });
                  if (v !== "sit-at-home" && v !== "practical") {
                    setValue("program", "");
                    setValue("batch", "");
                    setValue("module", "");
                    setValue("teachers", []);
                  }
                  if (v === "sit-at-home") {
                    setValue("teachers", []);
                  }
                  if (v === "practical") {
                    setValue("module", "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">{t("exam.form.online", "Online")}</SelectItem>
                  <SelectItem value="sit-at-home">{t("exam.form.sitAtHome", "Sit-at-home")}</SelectItem>
                  <SelectItem value="practical">{t("exam.form.practical", "Practical")}</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {(watch("type") === "sit-at-home" || watch("type") === "practical") && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white pb-2 border-b dark:border-white/10">
                  {watch("type") === "sit-at-home"
                    ? t("exam.form.sitAtHomeSettings", "Sit-at-home Settings")
                    : t("exam.form.practicalSettings", "Practical Settings")}
                </h4>
                
                <SearchableSelect
                  label={t("planningManagement.modal.programLabel")}
                  placeholder={t("planningManagement.modal.searchPrograms")}
                  searchPlaceholder={t("planningManagement.modal.searchPrograms")}
                  items={programs}
                  value={watch("program")}
                  onChange={(value) => {
                    if (value) {
                      setValue("program", value, { shouldValidate: true });
                      setValue("batch", "");
                      setValue("module", "");
                    }
                  }}
                  onSearch={setProgramSearchTerm}
                  isLoading={programsLoading}
                  error={errors.program?.message}
                  required={watch("type") === "sit-at-home"}
                />

                <SearchableSelect
                  label={t("planningManagement.modal.batchLabel")}
                  placeholder={t("planningManagement.modal.batchPlaceholder")}
                  searchPlaceholder={t("planningManagement.modal.searchBatches")}
                  items={batches}
                  value={watch("batch")}
                  onChange={(value) => {
                    if (value) setValue("batch", value, { shouldValidate: true });
                  }}
                  onSearch={setBatchSearchTerm}
                  isLoading={batchesLoading}
                  error={errors.batch?.message}
                  disabled={!selectedProgram}
                  required={watch("type") === "sit-at-home"}
                />

                {watch("type") === "sit-at-home" && (
                  <SearchableSelect
                    label={t("exam.form.moduleLabel", "Module")}
                    placeholder={t("exam.form.modulePlaceholder", "Select Module")}
                    searchPlaceholder={t("exam.form.searchModules", "Search Modules")}
                    items={modules}
                    value={watch("module")}
                    onChange={(value) => {
                      if (value) setValue("module", value, { shouldValidate: true });
                    }}
                    isLoading={modulesLoading}
                    error={errors.module?.message}
                    disabled={!selectedProgram}
                    required
                  />
                )}

                {watch("type") === "practical" && (
                  <SearchableMultiSelect
                    label={t("exam.form.teachersLabel", "Teachers")}
                    placeholder={t("exam.form.teachersPlaceholder", "Select Teachers")}
                    searchPlaceholder={t("exam.form.searchTeachers", "Search Teachers")}
                    items={teachersList}
                    selected={selectedTeachersObjects}
                    onChange={(selectedItems) => {
                      setValue("teachers", selectedItems.map(item => item._id), { shouldValidate: true });
                    }}
                    onSearch={setTeacherSearchTerm}
                    isLoading={teachersLoading}
                    error={errors.teachers?.message}
                  />
                )}

                {watch("type") === "sit-at-home" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {t("planningManagement.modal.maxAttempts", "Max Attempts")}
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          {...register("max_attempts", { valueAsNumber: true })}
                        />
                        {errors.max_attempts && (
                          <p className="text-sm text-red-500">
                            {errors.max_attempts.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {t("planningManagement.modal.cooldownDays", "Cooldown (Days)")}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          {...register("cooldown_days", { valueAsNumber: true })}
                        />
                        {errors.cooldown_days && (
                          <p className="text-sm text-red-500">
                            {errors.cooldown_days.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("planningManagement.modal.deadline", "Deadline")}
                      </Label>
                      <Input
                        type="date"
                        {...register("deadline")}
                      />
                      {errors.deadline && (
                        <p className="text-sm text-red-500">
                          {errors.deadline.message}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("name")}
                placeholder={t("exam.form.namePlaceholder")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.description")}
              </Label>
              <Textarea
                {...register("description")}
                className="min-h-[60px]"
                placeholder={t("exam.form.descriptionPlaceholder")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.instructions")}
              </Label>
              <Textarea
                {...register("instructions")}
                className="min-h-[80px]"
                placeholder={t("exam.form.instructionsPlaceholder")}
              />
              {errors.instructions && (
                <p className="text-sm text-red-500">
                  {errors.instructions.message}
                </p>
              )}
            </div>

            {watch("type") !== "practical" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("exam.form.language") || "Language"} <span className="text-red-500">*</span>
                </Label>
                <Select
                  key={`exam_language-${watch("exam_language")}`}
                  value={watch("exam_language") || ""}
                  onValueChange={(v) => {
                    setValue("exam_language", v, { shouldValidate: true });
                    setValue("question_sources", []);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang._id} value={lang._id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.exam_language && (
                  <p className="text-sm text-red-500">{errors.exam_language.message}</p>
                )}
              </div>
            )}

            {watch("type") !== "practical" && (
              <QuestionSourceSelector
                value={questionSources}
                onChange={(v) => setValue("question_sources", v)}
                error={errors.question_sources?.message}
                selectedLanguage={watch("exam_language")}
              />
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("exam.form.duration")} <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("duration", { valueAsNumber: true })}
                type="number"
                min={1}
              />
              {errors.duration && (
                <p className="text-sm text-red-500">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {watch("passing_type") === "marks" ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("exam.form.passingMarks")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("passing_marks", { valueAsNumber: true })}
                    type="number"
                    min={0}
                  />
                  {errors.passing_marks && (
                    <p className="text-sm text-red-500">
                      {errors.passing_marks.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("exam.form.passingPercentage", "Passing Percentage")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("passing_percentage", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    max={100}
                  />
                  {errors.passing_percentage && (
                    <p className="text-sm text-red-500">
                      {errors.passing_percentage.message}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("exam.form.passingType")}
                </Label>
                <Select
                  key={`passing_type-${watch("passing_type")}`}
                  value={watch("passing_type")}
                  onValueChange={(v) => setValue("passing_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marks">{t("exam.form.marks")}</SelectItem>
                    <SelectItem value="percentage">
                      {t("exam.form.percentage")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.passing_type && (
                  <p className="text-sm text-red-500">
                    {errors.passing_type.message}
                  </p>
                )}
              </div>
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

export default ExamForm;
