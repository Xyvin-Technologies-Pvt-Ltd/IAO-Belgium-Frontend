import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useTranslation } from "react-i18next";
import { useCreateIntake, useUpdateIntake } from "@/store/useIntakeStore";
import { useGetPrograms } from "@/store/useProgramStore";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { intakeSchema } from "@/validations/admin";

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
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(intakeSchema),
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

  // Reset pagination when modal opens
  useEffect(() => {
    if (open) {
      setProgramPage(1);
      setAllPrograms([]); // Reset cache when modal opens
    }
  }, [open]);

  // Cache programs as they are loaded
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
    setAllPrograms([]); // Clear cache on close
    onClose();
  };

  // Convert programs data to options format
  const programOptions = (programsData?.data || []).map((program) => ({
    value: program._id,
    label: program.name,
  }));

  const handleProgramSelect = (programId) => {
    const currentPrograms = selectedPrograms || [];
    if (currentPrograms.includes(programId)) {
      setValue(
        "program",
        currentPrograms.filter((id) => id !== programId),
      );
    } else {
      setValue("program", [...currentPrograms, programId]);
    }
  };

  const handleProgramRemove = (programId) => {
    const currentPrograms = selectedPrograms || [];
    setValue(
      "program",
      currentPrograms.filter((id) => id !== programId),
    );
  };

  const getSelectedProgramNames = () => {
    return (selectedPrograms || []).map((id) => {
      const program = allPrograms.find((p) => p._id === id);
      return program ? program.name : id;
    });
  };

  useEffect(() => {
    if (intakeData && isEdit && open) {
      setValue("name", intakeData.name || "");

      // Handle program data and add to cache
      let programIds = [];
      if (Array.isArray(intakeData.program)) {
        programIds = intakeData.program.map((p) => p._id || p);
        // Add program objects to cache if they have full data
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
        programIds = [intakeData.program._id];
        // Add single program to cache if it has full data
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

      setValue("program", programIds);
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
      program: formData.program,
      admission_fee: Number(formData.admission_fee),
      start_date: formData.start_date,
      end_date: formData.end_date,
      registration_deadline: formData.registration_deadline,
      student_per_batch: Number(formData.student_per_batch),
      max_student_enrollment: Number(formData.max_student_enrollment),
      academic: academicId, // Add academicId as academic
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
  const hasProgramPrev = programPage > 1;
  const hasProgramNext = programPage < totalPages;

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

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("intakeManagement.modal.programLabel")}{" "}
              <span className="text-red-500">*</span>
            </Label>

            <Controller
              name="program"
              control={control}
              render={({ field }) => (
                <Select value="" onValueChange={handleProgramSelect}>
                  <SelectTrigger
                    className={`min-h-[40px] ${errors.program ? "border-red-500" : ""}`}
                  >
                    <div className="flex flex-wrap gap-1 w-full">
                      {selectedPrograms && selectedPrograms.length > 0 ? (
                        <>
                          {getSelectedProgramNames().map(
                            (programName, index) => (
                              <Badge
                                key={selectedPrograms[index]}
                                variant="secondary"
                                className="flex items-center gap-1 text-xs px-2 py-1"
                              >
                                {programName}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-3 w-3 p-0 hover:bg-transparent ml-1"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleProgramRemove(
                                      selectedPrograms[index],
                                    );
                                  }}
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </Badge>
                            ),
                          )}
                          <span className="text-sm text-muted-foreground ml-2 self-center">
                            Click to add more...
                          </span>
                        </>
                      ) : (
                        <SelectValue
                          placeholder={t(
                            "intakeManagement.modal.programPlaceholder",
                          )}
                        />
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="w-[var(--radix-select-trigger-width)]"
                  >
                    <div className="max-h-[300px] overflow-y-auto">
                      {programs.length > 0 ? (
                        programs.map((program) => {
                          const isSelected = selectedPrograms?.includes(
                            program._id,
                          );
                          return (
                            <SelectItem
                              key={program._id}
                              value={program._id}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{program.name}</span>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 ml-2" />
                                )}
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No programs available
                        </div>
                      )}
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
                          disabled={!hasProgramPrev}
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
                          disabled={!hasProgramNext}
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
