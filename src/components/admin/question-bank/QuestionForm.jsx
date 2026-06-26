import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, X } from "lucide-react";
import FormActions from "@/components/ui/forms/FormActions";
import { Button } from "@/components/ui/button";
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
import { useAddQuestion, useUpdateQuestion } from "@/store/useQuestionBankStore";
import { questionSchema } from "@/validations/admin/question.validation";
import { cn } from "@/lib/utils";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const QuestionForm = ({
  open,
  onClose,
  questionBankId,
  questionData,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const isEdit = !!questionData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: "",
      options: [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
      ],
      explanation: "",
      difficulty: "understand",
      marks: 1,
    },
  });

  const options = watch("options") || [];
  const addQuestion = useAddQuestion();
  const updateQuestion = useUpdateQuestion();

  const handleClose = () => {
    reset({
      question_text: "",
      options: [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
      ],
      explanation: "",
      difficulty: "understand",
      marks: 1,
    });
    onClose();
  };

  useEffect(() => {
    if (questionData && open) {
      const formData = {
        question_text: questionData.question_text || "",
        options:
          questionData.options?.map((o) => ({
            option_text: o.option_text || "",
            is_correct: o.is_correct || false,
          })) || [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ],
        explanation: questionData.explanation || "",
        difficulty: questionData.difficulty || "understand",
        marks: questionData.marks ?? 1,
      };
      
      reset(formData);
      setValue("difficulty", questionData.difficulty || "understand", { shouldValidate: true });
    } else if (!questionData && open) {
      reset({
        question_text: "",
        options: [
          { option_text: "", is_correct: true },
          { option_text: "", is_correct: false },
        ],
        explanation: "",
        difficulty: "understand",
        marks: 1,
      });
    }
  }, [questionData, reset, open, setValue]);

  const addOption = () => {
    if (options.length < 6) {
      setValue("options", [
        ...options,
        { option_text: "", is_correct: false },
      ]);
    }
  };

  const removeOption = (idx) => {
    if (options.length > 2) {
      const next = options.filter((_, i) => i !== idx);
      const hadCorrect = options[idx]?.is_correct;
      if (hadCorrect && next.length > 0) {
        next[0].is_correct = true;
      }
      setValue("options", next);
    }
  };

  const setCorrectOption = (idx) => {
    setValue(
      "options",
      options.map((o, i) => ({ ...o, is_correct: i === idx })),
      { shouldValidate: true },
    );
  };

  const onSubmit = (values) => {
    const mutation = isEdit ? updateQuestion : addQuestion;
    const mutationData = isEdit
      ? { questionBankId, questionId: questionData._id, data: values }
      : { questionBankId, data: values };

    mutation.mutate(mutationData, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = addQuestion.isPending || updateQuestion.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit
                  ? t("questionBank.questionForm.editQuestion")
                  : t("questionBank.questionForm.addQuestion")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/70">
                {isEdit
                  ? t("questionBank.questionForm.editSubtitle", "Update the question details")
                  : t("questionBank.questionForm.createSubtitle", "Fill in the question details")}
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
                {t("questionBank.questionForm.questionText")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                {...register("question_text")}
                className="min-h-[80px]"
                placeholder={t("questionBank.questionForm.questionTextPlaceholder")}
              />
              {errors.question_text && (
                <p className="text-sm text-red-500">
                  {errors.question_text.message}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("questionBank.questionForm.options")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={addOption}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t("questionBank.questionForm.addOption")}
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {options.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "border rounded-lg p-3 space-y-2 transition-all",
                      options[idx]?.is_correct
                        ? "border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-600"
                        : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(idx)}
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            options[idx]?.is_correct
                              ? "border-green-600 bg-green-600"
                              : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                          )}
                        >
                          {options[idx]?.is_correct && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {t("questionBank.questionForm.option")} {OPTION_LABELS[idx]}
                        </span>
                        {options[idx]?.is_correct && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-medium">
                            {t("questionBank.questionForm.correct")}
                          </span>
                        )}
                      </div>
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(idx)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <Input
                      {...register(`options.${idx}.option_text`)}
                      placeholder={`${t("questionBank.questionForm.enterOption")} ${OPTION_LABELS[idx]}`}
                    />
                    {errors.options?.[idx]?.option_text && (
                      <p className="text-sm text-red-500">
                        {errors.options[idx].option_text.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              {errors.options?.message && (
                <p className="text-sm text-red-500">
                  {errors.options.message}
                </p>
              )}
              {errors.options?.root && (
                <p className="text-sm text-red-500">
                  {errors.options.root.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t("questionBank.questionForm.explanation")}
              </Label>
              <Textarea
                {...register("explanation")}
                className="min-h-[60px]"
                placeholder={t("questionBank.questionForm.explanationPlaceholder")}
              />
              {errors.explanation && (
                <p className="text-sm text-red-500">
                  {errors.explanation.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("questionBank.questionForm.difficulty")}
                </Label>
                <Select
                  key={`difficulty-${questionData?._id || "new"}-${watch("difficulty")}`}
                  value={watch("difficulty") || "understand"}
                  onValueChange={(v) => {
                    if (v && ["remember", "understand", "apply", "analyze", "evaluate", "create"].includes(v)) {
                      setValue("difficulty", v, { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("questionBank.questionForm.selectDifficultyPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remember">
                      {t("questionBank.questionForm.remember")}
                    </SelectItem>
                    <SelectItem value="understand">
                      {t("questionBank.questionForm.understand")}
                    </SelectItem>
                    <SelectItem value="apply">
                      {t("questionBank.questionForm.apply")}
                    </SelectItem>
                    <SelectItem value="analyze">
                      {t("questionBank.questionForm.analyze")}
                    </SelectItem>
                    <SelectItem value="evaluate">
                      {t("questionBank.questionForm.evaluate")}
                    </SelectItem>
                    <SelectItem value="create">
                      {t("questionBank.questionForm.create")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.difficulty && (
                  <p className="text-sm text-red-500">
                    {errors.difficulty.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("questionBank.questionForm.marks")}
                </Label>
                <Input
                  {...register("marks", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step={0.5}
                />
                {errors.marks && (
                  <p className="text-sm text-red-500">
                    {errors.marks.message}
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

export default QuestionForm;
