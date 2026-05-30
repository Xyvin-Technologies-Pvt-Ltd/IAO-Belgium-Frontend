import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { useTranslation } from "react-i18next";
import { useCreateIntake, useUpdateIntake } from "@/store/useIntakeStore";
import { useGetAllPrograms } from "@/store/useDropdownStore";
import { intakeSchema } from "@/validations/admin";
import moment from "moment";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CreateIntake = ({ open, onClose, intakeData, academicId }) => {
  const { t } = useTranslation();
  const isEdit = !!intakeData;

  const [programSearchTerm, setProgramSearchTerm] = useState("");

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    {
      ...(programSearchTerm && { search: programSearchTerm }),
    },
    { enabled: open },
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(intakeSchema),
    mode: "onChange",
    defaultValues: {
      ...(isEdit && { name: "" }),
      program: [],
      admission_fee: "",
      is_free: false,
      start_date: "",
      end_date: "",
      registration_deadline: "",
      student_per_batch: "",
      max_student_enrollment: "",
    },
  });

  const createIntake = useCreateIntake();
  const updateIntake = useUpdateIntake();

  const selectedPrograms = watch("program");
  const isFree = watch("is_free");

  const formatProgramData = (program) => {
    if (!program) return null;
    return {
      ...program,
      name: `${program.name} - ${program.city?.name || ""} - ${program.language?.name || ""}`,
    };
  };

  const formattedProgramsData = programsData?.data?.map(formatProgramData) || [];

  const handleClose = () => {
    reset({
      ...(isEdit && { name: "" }),
      program: [],
      admission_fee: "",
      is_free: false,
      start_date: "",
      end_date: "",
      registration_deadline: "",
      student_per_batch: "",
      max_student_enrollment: "",
    });
    // Reset search term
    setProgramSearchTerm("");
    onClose();
  };

  useEffect(() => {
    if (!open || !intakeData) return;

    reset({
      name: intakeData.name || "",
      program: Array.isArray(intakeData.program)
        ? intakeData.program.map(formatProgramData)
        : intakeData.program?._id
          ? [formatProgramData(intakeData.program)]
          : [],
      admission_fee: intakeData.admission_fee ?? "",
      is_free: intakeData.admission_fee === 0,
      start_date: intakeData.start_date
        ? intakeData.start_date.split("T")[0]
        : "",
      end_date: intakeData.end_date ? intakeData.end_date.split("T")[0] : "",
      registration_deadline: intakeData.registration_deadline
        ? intakeData.registration_deadline.split("T")[0]
        : "",
      student_per_batch: intakeData.student_per_batch || "",
      max_student_enrollment: intakeData.max_student_enrollment || "",
    });
  }, [open, intakeData, reset]);

  useEffect(() => {
    if (isFree) {
      setValue("admission_fee", 0, { shouldValidate: true });
    }
  }, [isFree, setValue]);

  const onSubmit = (formData) => {
    const isDeadlinePassed = moment(formData.registration_deadline).endOf("day").isBefore(moment());
    const status = isDeadlinePassed ? "closed" : "open";

    const payload = {
      ...(isEdit && { name: formData.name }),
      program: formData.program.map((p) => p._id),
      admission_fee: formData.is_free ? 0 : Number(formData.admission_fee),
      start_date: formData.start_date,
      end_date: formData.end_date,
      registration_deadline: formData.registration_deadline,
      student_per_batch: Number(formData.student_per_batch),
      max_student_enrollment: Number(formData.max_student_enrollment),
      academic: academicId,
      status,
    };

    const mutation = isEdit ? updateIntake : createIntake;
    const mutationData = isEdit
      ? { id: intakeData._id, data: payload }
      : payload;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createIntake.isPending || updateIntake.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit
                ? t("intakeManagement.modal.editTitle")
                : t("intakeManagement.modal.createTitle")}
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isEdit && (
            <FormField
              label={t("intakeManagement.modal.nameLabel")}
              placeholder={t("intakeManagement.modal.namePlaceholder")}
              error={errors.name?.message}
              disabled={true}
              {...register("name")}
            />
          )}

          <SearchableMultiSelect
            label={t("intakeManagement.modal.programLabel")}
            placeholder={t("intakeManagement.modal.programPlaceholder")}
            searchPlaceholder={t("intakeManagement.modal.searchPrograms")}
            items={formattedProgramsData}
            selected={selectedPrograms}
            onChange={(val) =>
              setValue("program", val, { shouldValidate: true })
            }
            onSearch={setProgramSearchTerm}
            isLoading={programsLoading}
            error={errors.program?.message}
            required
          />

          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-lg border dark:border-white/10">
            <Controller
              name="is_free"
              control={control}
              render={({ field }) => (
                <Switch
                  id="is_free"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <div className="flex flex-col">
              <Label htmlFor="is_free" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                {t("intakeManagement.modal.freeIntakeLabel", "Free Intake")}
              </Label>
              <span className="text-xs text-muted-foreground">
                {t("intakeManagement.modal.freeIntakeDescription", "Enable if this intake does not require any registration fee")}
              </span>
            </div>
          </div>

          {!isFree && (
            <FormField
              label={t("intakeManagement.modal.registrationFeeLabel")}
              placeholder={t("intakeManagement.modal.registrationFeePlaceholder")}
              type="number"
              error={errors.admission_fee?.message}
              required
              {...register("admission_fee")}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("intakeManagement.modal.startDateLabel")}
              type="date"
              error={errors.start_date?.message}
              required
              {...register("start_date")}
            />

            <FormField
              label={t("intakeManagement.modal.endDateLabel")}
              type="date"
              error={errors.end_date?.message}
              required
              {...register("end_date")}
            />
          </div>

          <FormField
            label={t("intakeManagement.modal.registrationDeadlineLabel")}
            type="date"
            error={errors.registration_deadline?.message}
            required
            {...register("registration_deadline")}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("intakeManagement.modal.maxStudentEnrollmentLabel")}
              placeholder={t(
                "intakeManagement.modal.maxStudentEnrollmentPlaceholder",
              )}
              type="number"
              error={errors.max_student_enrollment?.message}
              required
              {...register("max_student_enrollment")}
            />
            <FormField
              label={t("intakeManagement.modal.studentsPerBatchLabel")}
              placeholder={t(
                "intakeManagement.modal.studentsPerBatchPlaceholder",
              )}
              type="number"
              error={errors.student_per_batch?.message}
              required
              {...register("student_per_batch")}
            />
          </div>

          <FormActions
            onCancel={handleClose}
            isLoading={isSubmitting}
            isEdit={isEdit}
          />
        </form>
      </div>
    </div>
  );
};

export default CreateIntake;
