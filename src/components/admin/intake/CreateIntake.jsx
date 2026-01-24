import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { useTranslation } from "react-i18next";
import { useCreateIntake, useUpdateIntake } from "@/store/useIntakeStore";
import { useGetAllPrograms } from "@/store/useDropdownStore";
import { intakeSchema } from "@/validations/admin";

const CreateIntake = ({ open, onClose, intakeData, academicId }) => {
  const { t } = useTranslation();
  const isEdit = !!intakeData;

  const [programSearchTerm, setProgramSearchTerm] = useState("");

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    { 
      ...(programSearchTerm && { search: programSearchTerm })
    },
    { enabled: open }
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(intakeSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      program: [],
      admission_fee: "",
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

  const handleClose = () => {
    reset({
      name: "",
      program: [],
      admission_fee: "",
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
        ? intakeData.program
        : intakeData.program?._id
          ? [intakeData.program]
          : [],
      admission_fee: intakeData.admission_fee || "",
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

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      program: formData.program.map((p) => p._id),
      admission_fee: Number(formData.admission_fee),
      start_date: formData.start_date,
      end_date: formData.end_date,
      registration_deadline: formData.registration_deadline,
      student_per_batch: Number(formData.student_per_batch),
      max_student_enrollment: Number(formData.max_student_enrollment),
      academic: academicId,
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit
            ? t("intakeManagement.modal.editTitle")
            : t("intakeManagement.modal.createTitle")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {isEdit
            ? t("intakeManagement.modal.editSubtitle")
            : t("intakeManagement.modal.createSubtitle")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label={t("intakeManagement.modal.nameLabel")}
            placeholder={t("intakeManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name")}
          />

          <SearchableMultiSelect
            label={t("intakeManagement.modal.programLabel")}
            placeholder={t("intakeManagement.modal.programPlaceholder")}
            searchPlaceholder="Search programs..."
            items={programsData?.data || []}
            selected={selectedPrograms}
            onChange={(val) =>
              setValue("program", val, { shouldValidate: true })
            }
            onSearch={setProgramSearchTerm}
            isLoading={programsLoading}
            error={errors.program?.message}
            required
          />

          <FormField
            label={t("intakeManagement.modal.admissionFeeLabel")}
            placeholder={t("intakeManagement.modal.admissionFeePlaceholder")}
            type="number"
            error={errors.admission_fee?.message}
            required
            {...register("admission_fee")}
          />

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
              label={t("intakeManagement.modal.studentsPerBatchLabel")}
              placeholder={t(
                "intakeManagement.modal.studentsPerBatchPlaceholder",
              )}
              type="number"
              error={errors.student_per_batch?.message}
              required
              {...register("student_per_batch")}
            />

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
