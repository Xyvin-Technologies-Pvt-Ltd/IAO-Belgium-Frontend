import { useEffect, useState } from "react";
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
import { useCreateExam, useUpdateExam, useGetExamsDropdown } from "@/store/useExamStore";
import {
  useGetAllLanguages,
  useGetAllPrograms,
  useGetBatches,
  useGetComponents,
} from "@/store/useDropdownStore";
import { examSchema } from "@/validations/admin/exam.validation";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";

const ExamForm = ({ open, onClose, examData, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!examData;

  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");

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
      parent_exam: "",
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
    { enabled: open && selectedType === "sit-at-home" },
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
    { enabled: open && selectedType === "sit-at-home" && !!selectedProgram },
  );

  const batches = (batchesData?.data || []).map((batch) => ({
    _id: batch._id,
    name: batch.name,
  }));

  const { data: modulesData, isLoading: modulesLoading } = useGetComponents(
    {
      type: "module",
      program: selectedProgram,
      status: true,
    },
    { enabled: open && selectedType === "sit-at-home" && !!selectedProgram },
  );

  const modules = (modulesData?.data || []).map((module) => ({
    _id: module._id,
    name: module.name,
  }));

  const questionSources = watch("question_sources") || [];
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const parentLocked = isEdit && !!(examData?.parent_exam);

  const { data: parentExamsData, isLoading: parentExamsLoading } = useGetExamsDropdown(
    {
      type: selectedType,
      exclude_resits: true,
      status: "published",
    },
    { enabled: open },
  );
  const parentExams = [
    { _id: "__none__", name: t("exam.form.resitOfNone", "None — this is a normal exam") },
    ...(parentExamsData?.data || []).map((exam) => ({
      _id: exam._id,
      name: exam.uid ? `${exam.name} (${exam.uid})` : exam.name,
    })),
  ];
  const currentParent = examData?.parent_exam;
  if (currentParent?._id && !parentExams.some((e) => e._id === currentParent._id)) {
    parentExams.splice(1, 0, {
      _id: currentParent._id,
      name: currentParent.uid
        ? `${currentParent.name} (${currentParent.uid})`
        : currentParent.name,
    });
  }

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
      parent_exam: "",
    });
    setProgramSearchTerm("");
    setBatchSearchTerm("");
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
        parent_exam: examData.parent_exam?._id || examData.parent_exam || "",
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
        parent_exam: "",
      });
      setProgramSearchTerm("");
      setBatchSearchTerm("");
    }
  }, [examData, reset, open]);

  const onSubmit = (values) => {
    const finalValues = { ...values };
    if (values.passing_type === "percentage") {
      delete finalValues.passing_marks;
    } else {
      delete finalValues.passing_percentage;
    }

    if (values.type === "sit-at-home") {
      delete finalValues.program;
      finalValues.max_attempts = Number(values.max_attempts) || 2;
      finalValues.cooldown_days = Number(values.cooldown_days) ?? 7;
      finalValues.deadline = values.deadline || null;
      finalValues.teachers = [];
      finalValues.batch = values.batch || null;
      finalValues.module = values.module || null;
    } else if (values.type === "practical") {
      delete finalValues.program;
      delete finalValues.max_attempts;
      delete finalValues.cooldown_days;
      delete finalValues.deadline;
      finalValues.question_sources = [];
      finalValues.exam_language = null;
      finalValues.teachers = [];
      finalValues.batch = null;
      finalValues.module = null;
    } else {
      delete finalValues.program;
      delete finalValues.batch;
      delete finalValues.module;
      delete finalValues.max_attempts;
      delete finalValues.cooldown_days;
      delete finalValues.deadline;
      delete finalValues.teachers;
    }

    if (values.parent_exam && values.parent_exam !== "__none__") {
      finalValues.parent_exam = values.parent_exam;
      finalValues.is_resit = true;
    } else {
      finalValues.parent_exam = null;
      finalValues.is_resit = false;
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
                  setValue("parent_exam", "");
                  if (v !== "sit-at-home") {
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
                    setValue("program", "");
                    setValue("batch", "");
                    setValue("teachers", []);
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

            <SearchableSelect
              label={t("exam.form.resitOf", "Resit of")}
              placeholder={t("exam.form.resitOfPlaceholder", "None — this is a normal exam")}
              searchPlaceholder={t("exam.form.resitOfSearch", "Search exams...")}
              items={parentExams}
              value={watch("parent_exam") || "__none__"}
              onChange={(value) => {
                setValue("parent_exam", !value || value === "__none__" ? "" : value);
              }}
              isLoading={parentExamsLoading}
              disabled={parentLocked}
              error={errors.parent_exam?.message}
            />

            {watch("type") === "sit-at-home" && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white pb-2 border-b dark:border-white/10">
                  {t("exam.form.sitAtHomeSettings", "Sit-at-home Settings")}
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
                  required
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
                  required
                />

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
