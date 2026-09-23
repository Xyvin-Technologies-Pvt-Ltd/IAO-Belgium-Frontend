import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useAddAttachment, useUpdateAttachment } from "@/store/useSkillDayStore";
import { useGetAllPrograms, useGetBatches } from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const AttachGroupModal = ({
  open,
  onClose,
  skillDayId,
  attachmentData = null,
}) => {
  const { t } = useTranslation();
  const isEdit = !!attachmentData;

  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");

  const addAttachmentMutation = useAddAttachment();
  const updateAttachmentMutation = useUpdateAttachment();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      program: "",
      batch_id: "",
      year: 1,
      cost_type: "free",
      requirement: "optional",
      currency: "EUR",
      amount: 0,
    },
  });

  const selectedProgram = watch("program");
  const selectedBatchId = watch("batch_id");
  const costType = watch("cost_type");
  const requirement = watch("requirement");

  // Fetch programs (matching CreatePlanning.jsx)
  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    {
      ...(programSearchTerm && { search: programSearchTerm }),
    },
    { enabled: open }
  );

  const programsRaw = useMemo(() => {
    if (!open || !programsData) return [];
    if (Array.isArray(programsData.data)) return programsData.data;
    if (Array.isArray(programsData)) return programsData;
    if (Array.isArray(programsData?.data?.data)) return programsData.data.data;
    return [];
  }, [open, programsData]);

  const programs = useMemo(() => {
    return programsRaw.map((program) => {
      const cityName = program.city?.name || (typeof program.city === "string" ? program.city : null);
      const langName = program.language?.name || (typeof program.language === "string" ? program.language : null);
      const mode = program.is_online ? "Online" : "Offline";
      const details = [cityName, langName, mode].filter(Boolean).join(" • ");
      const pId = program._id?._id ? String(program._id._id) : String(program._id);
      return {
        _id: pId,
        name: `${program.name}${details ? ` (${details})` : ""}`,
        city: program.city,
        language: program.language,
        year: program.year,
        duration_unit: program.duration_unit,
      };
    });
  }, [programsRaw]);

  // Fetch batches for selected program (matching CreatePlanning.jsx)
  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgram,
    {
      ...(batchSearchTerm && { search: batchSearchTerm }),
      include_closed: true,
    },
    { enabled: open && !!selectedProgram }
  );

  const batchesRaw = useMemo(() => {
    if (!open || !selectedProgram || !batchesData) return [];
    if (Array.isArray(batchesData.data)) return batchesData.data;
    if (Array.isArray(batchesData)) return batchesData;
    if (Array.isArray(batchesData?.data?.data)) return batchesData.data.data;
    return [];
  }, [open, selectedProgram, batchesData]);

  const batches = useMemo(() => {
    return batchesRaw.map((batch) => {
      const uidStr = batch.uid ? `UID: ${batch.uid}` : "";
      const academicStr =
        batch.intake?.academic?.name ||
        batch.intake?.name ||
        (batch.coachview_cohort?.academic_year ? `Academic Year ${batch.coachview_cohort.academic_year}` : "");
      const info = [uidStr, academicStr].filter(Boolean).join(" • ");
      const bId = batch._id?._id ? String(batch._id._id) : String(batch._id);
      return {
        _id: bId,
        name: `${batch.name}${info ? ` (${info})` : ""}`,
      };
    });
  }, [batchesRaw]);

  // Selected Program object for dynamic year count & duration unit
  const selectedProgramObj = useMemo(() => {
    return (
      programsRaw.find((p) => {
        const id = p._id?._id ? String(p._id._id) : String(p._id);
        return id === String(selectedProgram);
      }) || null
    );
  }, [programsRaw, selectedProgram]);

  // Duration unit label & dynamic options array
  const { unitLabel, yearOptions } = useMemo(() => {
    const maxYear = selectedProgramObj?.year || 5;
    const durationUnit = (selectedProgramObj?.duration_unit || "years").toLowerCase();

    let label = "Year";
    if (durationUnit.startsWith("month")) label = "Month";
    else if (durationUnit.startsWith("week")) label = "Week";
    else if (durationUnit.startsWith("day")) label = "Day";

    const options = Array.from({ length: maxYear }, (_, i) => i + 1);
    return { unitLabel: label, yearOptions: options };
  }, [selectedProgramObj]);

  useEffect(() => {
    if (open) {
      if (attachmentData) {
        const batchObj = attachmentData.batch || {};
        reset({
          program: "",
          batch_id: batchObj._id || attachmentData.batch || "",
          year: attachmentData.year || 1,
          cost_type: attachmentData.cost_type || "free",
          requirement: attachmentData.requirement || "optional",
          currency: attachmentData.currency || "EUR",
          amount: attachmentData.amount || 0,
        });
      } else {
        reset({
          program: "",
          batch_id: "",
          year: 1,
          cost_type: "free",
          requirement: "optional",
          currency: "EUR",
          amount: 0,
        });
      }
    }
  }, [open, attachmentData, reset]);

  const handleCostTypeChange = (type) => {
    setValue("cost_type", type);
    if (type === "paid") {
      setValue("requirement", "required");
    } else {
      setValue("requirement", "optional");
    }
  };

  if (!open) return null;

  const handleClose = () => {
    reset({
      program: "",
      batch_id: "",
      year: 1,
      cost_type: "free",
      requirement: "optional",
      currency: "EUR",
      amount: 0,
    });
    setProgramSearchTerm("");
    setBatchSearchTerm("");
    onClose();
  };

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateAttachmentMutation.mutateAsync({
          skillDayId,
          attachmentId: attachmentData._id,
          ...values,
        });
      } else {
        await addAttachmentMutation.mutateAsync({
          skillDayId,
          ...values,
        });
      }
      handleClose();
    } catch (err) {
      // Toast handled by store
    }
  };

  const isLoading =
    addAttachmentMutation.isPending || updateAttachmentMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-black border dark:border-white/20 shadow-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit ? "Edit Group Attachment" : "Attach Group to Skill Day"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-l-2 border-gray-300 dark:border-zinc-700 pl-2.5">
                Group Selection
              </h3>

              {!isEdit && (
                <SearchableSelect
                  label="Select Program"
                  placeholder="Select program"
                  searchPlaceholder="Search programs"
                  items={programs}
                  value={watch("program")}
                  onChange={(value) => {
                    if (value) {
                      setValue("program", value);
                      setValue("batch_id", "");
                    }
                  }}
                  onSearch={setProgramSearchTerm}
                  isLoading={programsLoading}
                  error={errors.program?.message}
                  required
                />
              )}

              <div>
                {!isEdit ? (
                  <SearchableSelect
                    label="Group"
                    placeholder={
                      selectedProgram
                        ? "Select group"
                        : "Select program first"
                    }
                    searchPlaceholder="Search groups"
                    items={batches}
                    value={watch("batch_id")}
                    onChange={(value) => {
                      if (value) setValue("batch_id", value);
                    }}
                    onSearch={setBatchSearchTerm}
                    isLoading={batchesLoading}
                    disabled={!selectedProgram}
                    error={errors.batch_id?.message}
                    required
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Group <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={attachmentData?.batch?.name || "Attached Group"}
                      className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Program {unitLabel} <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="year"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={String(field.value || 1)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${unitLabel}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {unitLabel} {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Cost Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCostTypeChange("free")}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                      costType === "free"
                        ? "border-[#ff8904] bg-[#ff8904]/10 text-[#ff8904]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCostTypeChange("paid")}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                      costType === "paid"
                        ? "border-[#ff8904] bg-[#ff8904]/10 text-[#ff8904]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Requirement
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("requirement", "required")}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                      requirement === "required"
                        ? "border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Required
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("requirement", "optional")}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                      requirement === "optional"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Optional
                  </button>
                </div>
              </div>

              {costType === "paid" && (
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-orange-50/50 p-4 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30">
                  <FormField
                    label="Currency"
                    placeholder="Enter currency"
                    {...register("currency")}
                  />
                  <FormField
                    label="Amount (€)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter amount"
                    {...register("amount", { valueAsNumber: true })}
                    required
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <FormActions
              onCancel={handleClose}
              isLoading={isLoading}
              isEdit={isEdit}
              submitText={isEdit ? "Update Attachment" : "Attach Group"}
              cancelText="Cancel"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default AttachGroupModal;
