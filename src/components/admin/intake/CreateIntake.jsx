import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useTranslation } from "react-i18next";
import { useCreateIntake, useUpdateIntake } from "@/store/useIntakeStore";
import { useGetPrograms } from "@/store/useProgramStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { intakeSchema } from "@/validations/admin";

const CreateIntake = ({ open, onClose, intakeData }) => {
  const { t } = useTranslation();
  const [programPage, setProgramPage] = useState(1);
  const programLimit = 10;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      name: "",
      program: "",
      admission_fee: "",
      start_date: "",
      end_date: "",
      registration_deadline: "",
      student_per_batch: "",
      max_student_enrollment: "",
    },
  });

  const isEdit = !!intakeData;
  const createIntake = useCreateIntake();
  const updateIntake = useUpdateIntake();
  const { data: programsData } = useGetPrograms(
    {
      status: true,
      page: programPage,
      limit: programLimit,
    },
    { enabled: open }
  );

  const selectedProgram = watch("program");

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (intakeData && isEdit && open) {
      setValue("name", intakeData.name || "");
      setValue("program", intakeData.program?._id || "");
      setValue("admission_fee", intakeData.admission_fee || "");
      setValue(
        "start_date",
        intakeData.start_date ? intakeData.start_date.split("T")[0] : ""
      );
      setValue(
        "end_date",
        intakeData.end_date ? intakeData.end_date.split("T")[0] : ""
      );
      setValue(
        "registration_deadline",
        intakeData.registration_deadline
          ? intakeData.registration_deadline.split("T")[0]
          : ""
      );
      setValue("student_per_batch", intakeData.student_per_batch || "");
      setValue(
        "max_student_enrollment",
        intakeData.max_student_enrollment || ""
      );
    }
  }, [intakeData, isEdit, setValue, open]);

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name,
      program: formData.program,
      admission_fee: Number(formData.admission_fee),
      start_date: formData.start_date,
      end_date: formData.end_date,
      registration_deadline: formData.registration_deadline,
      student_per_batch: Number(formData.student_per_batch),
      max_student_enrollment: Number(formData.max_student_enrollment),
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
  const programs = programsData?.data || [];
  const totalPrograms = programsData?.total_count || 0;
  const totalPages = Math.ceil(totalPrograms / programLimit);
  const hasPrevPage = programPage > 1;
  const hasNextPage = programPage < totalPages;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit
            ? t("languageManagement.modal.editTitle")
            : t("languageManagement.modal.createTitle")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/70 mb-6">
          {isEdit
            ? t("languageManagement.modal.editSubtitle")
            : t("languageManagement.modal.createSubtitle")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label={t("languageManagement.modal.nameLabel")}
            placeholder={t("languageManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name")}
          />

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Program <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="program"
              control={control}
              render={({ field }) => (
                <Select
                  key={selectedProgram || "empty-program"}
                  value={selectedProgram || ""}
                  onValueChange={(value) => setValue("program", value)}
                >
                  <SelectTrigger
                    className={errors.program ? "border-red-500" : ""}
                    whiteBg
                  >
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="w-[var(--radix-select-trigger-width)]"
                  >
                    <div className="max-h-[300px] overflow-y-auto">
                      {programs.map((program) => (
                        <SelectItem key={program._id} value={program._id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </div>
                    {totalPrograms > programLimit && (
                      <div className="flex items-center justify-center gap-2 px-2 py-2 border-t bg-background sticky bottom-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            setProgramPage((prev) => Math.max(1, prev - 1));
                          }}
                          disabled={!hasPrevPage}
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
                            setProgramPage((prev) => prev + 1);
                          }}
                          disabled={!hasNextPage}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.program && (
              <p className="text-sm text-red-500">{errors.program.message}</p>
            )}
          </div>

          <FormField
            label="Admission Fee"
            placeholder="Enter admission fee"
            type="number"
            error={errors.admission_fee?.message}
            required
            {...register("admission_fee")}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Date"
              type="date"
              error={errors.start_date?.message}
              required
              {...register("start_date")}
            />

            <FormField
              label="End Date"
              type="date"
              error={errors.end_date?.message}
              required
              {...register("end_date")}
            />
          </div>

          <FormField
            label="Registration Deadline"
            type="date"
            error={errors.registration_deadline?.message}
            required
            {...register("registration_deadline")}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Students Per Batch"
              placeholder="Enter students per batch"
              type="number"
              error={errors.student_per_batch?.message}
              required
              {...register("student_per_batch")}
            />

            <FormField
              label="Max Student Enrollment"
              placeholder="Enter max enrollment"
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
