import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useTranslation } from "react-i18next";
import { useCreateIntake, useUpdateIntake } from "@/store/useIntakeStore";
import { useGetPrograms } from "@/store/useProgramStore";
import { intakeSchema } from "@/validations/admin";
import PaginatedMultiSelect from "@/components/ui/forms/PaginationMultiSelect";

const CreateIntake = ({ open, onClose, intakeData, academicId }) => {
  const { t } = useTranslation();
  const [programPage, setProgramPage] = useState(1);
  const programLimit = 10;
  const [allPrograms, setAllPrograms] = useState([]);

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



  const isEdit = !!intakeData;
  const createIntake = useCreateIntake();
  const updateIntake = useUpdateIntake();
  const { data: programsData } = useGetPrograms(
    {
      status: true,
      page: programPage,
      limit: programLimit,
    },
    { enabled: open },
  );

  const selectedPrograms = watch("program");

  useEffect(() => {
    if (open) {
      setProgramPage(1);
    }
  }, [open]);

  useEffect(() => {
    if (programsData?.data) {
      setAllPrograms((prev) => {
        const newPrograms = programsData.data;
        const existingIds = prev.map((p) => p._id);
        const uniqueNewPrograms = newPrograms.filter(
          (p) => !existingIds.includes(p._id),
        );
        return [...prev, ...uniqueNewPrograms];
      });
    }
  }, [programsData?.data]);

  const handleClose = () => {
    reset();
    setProgramPage(1);
    onClose();
  };

 
  useEffect(() => {
    if (intakeData && isEdit && open) {
      setValue("name", intakeData.name || "");
      let programData = [];
      if (Array.isArray(intakeData.program)) {
        programData = intakeData.program;
        const programObjects = intakeData.program.filter(
          (p) => p._id && p.name,
        );
        if (programObjects.length > 0) {
          setAllPrograms((prev) => {
            const existingIds = prev.map((p) => p._id);
            const uniquePrograms = programObjects.filter(
              (p) => !existingIds.includes(p._id),
            );
            return [...prev, ...uniquePrograms];
          });
        }
      } else if (intakeData.program?._id) {
        programData = [intakeData.program];
        if (intakeData.program.name) {
          setAllPrograms((prev) => {
            const exists = prev.some((p) => p._id === intakeData.program._id);
            if (!exists) {
              return [...prev, intakeData.program];
            }
            return prev;
          });
        }
      }

      setValue("program", programData);
      setValue("admission_fee", intakeData.admission_fee || "");
      setValue(
        "start_date",
        intakeData.start_date ? intakeData.start_date.split("T")[0] : "",
      );
      setValue(
        "end_date",
        intakeData.end_date ? intakeData.end_date.split("T")[0] : "",
      );
      setValue(
        "registration_deadline",
        intakeData.registration_deadline
          ? intakeData.registration_deadline.split("T")[0]
          : "",
      );
      setValue("student_per_batch", intakeData.student_per_batch || "");
      setValue(
        "max_student_enrollment",
        intakeData.max_student_enrollment || "",
      );
    }
  }, [intakeData, isEdit, setValue, open]);

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

          <PaginatedMultiSelect
            label={t("intakeManagement.modal.programLabel")}
            placeholder={t("intakeManagement.modal.programPlaceholder")}
            items={
              allPrograms.length > 0 ? allPrograms : programsData?.data || []
            }
            selected={selectedPrograms}
            onChange={(val) =>
              setValue("program", val, { shouldValidate: true })
            }
            page={programPage}
            setPage={setProgramPage}
            total={programsData?.total_count || 0}
            limit={programLimit}
            error={errors.program?.message}
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
