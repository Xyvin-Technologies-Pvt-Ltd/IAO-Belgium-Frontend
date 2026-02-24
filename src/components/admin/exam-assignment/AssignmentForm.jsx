import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { useCreateExamAssignment, useUpdateExamAssignment } from "@/store/useExamAssignmentStore";
import { useGetExamsDropdown } from "@/store/useExamStore";
import { examAssignmentSchema } from "@/validations/admin/examAssignment.validation";
import axiosInstance from "@/api/axiosintercepter";

const AssignmentForm = ({ open, onClose, assignmentData, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!assignmentData;
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [components, setComponents] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(examAssignmentSchema),
    defaultValues: {
      exam: "",
      program: "",
      intake: "",
      batch: "",
      prerequisite_components: [],
      start_date: "",
      end_date: "",
    },
  });

  const watchedProgram = watch("program");
  const { data: examsData } = useGetExamsDropdown({ status: "published" });
  const exams = examsData?.data || [];
  const createAssignment = useCreateExamAssignment();
  const updateAssignment = useUpdateExamAssignment();

  useEffect(() => {
    const fetchPrograms = async () => {
        try {
          const res = await axiosInstance.get("/program/dropdown");
          setPrograms(res?.data?.data || []);
      } catch (err) {
        setPrograms([]);
      }
    };
    fetchPrograms();
  }, [open]);

  useEffect(() => {
    if (watchedProgram) {
      const fetchBatches = async () => {
        try {
          const res = await axiosInstance.get(
            `/intake/batches/program/${watchedProgram}`,
          );
          setBatches(res?.data?.data || []);
        } catch (err) {
          setBatches([]);
        }
      };
      fetchBatches();
    } else {
      setBatches([]);
      setComponents([]);
    }
  }, [watchedProgram]);

  useEffect(() => {
    if (watchedProgram) {
      const fetchComponents = async () => {
        try {
          const res = await axiosInstance.get("/components/dropdown", {
            params: { type: "module", program: watchedProgram },
          });
          setComponents(res?.data?.data || []);
        } catch (err) {
          setComponents([]);
        }
      };
      fetchComponents();
    }
  }, [watchedProgram]);

  useEffect(() => {
    if (assignmentData) {
      const sd = assignmentData.start_date
        ? new Date(assignmentData.start_date)
            .toISOString()
            .slice(0, 16)
        : "";
      const ed = assignmentData.end_date
        ? new Date(assignmentData.end_date).toISOString().slice(0, 16)
        : "";
      reset({
        exam: assignmentData.exam?._id || assignmentData.exam || "",
        program: assignmentData.program?._id || assignmentData.program || "",
        intake: assignmentData.intake?._id || assignmentData.intake || "",
        batch: assignmentData.batch?._id || assignmentData.batch || "",
        prerequisite_components:
          assignmentData.prerequisite_components?.map(
            (c) => c._id || c,
          ) || [],
        start_date: sd,
        end_date: ed,
      });
      setSelectedProgram(
        assignmentData.program?._id || assignmentData.program || "",
      );
    } else {
      reset({
        exam: "",
        program: "",
        intake: "",
        batch: "",
        prerequisite_components: [],
        start_date: "",
        end_date: "",
      });
      setSelectedProgram("");
    }
  }, [assignmentData, reset, open]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        exam: values.exam,
        program: values.program || undefined,
        intake: values.intake || undefined,
        batch: values.batch || undefined,
        prerequisite_components: values.prerequisite_components?.filter(
          Boolean,
        ) || [],
        start_date: new Date(values.start_date).toISOString(),
        end_date: new Date(values.end_date).toISOString(),
      };
      if (isEdit) {
        await updateAssignment.mutateAsync({
          id: assignmentData._id,
          data: payload,
        });
      } else {
        await createAssignment.mutateAsync(payload);
      }
      onSuccess?.();
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("examAssignment.form.editAssignment")
              : t("examAssignment.form.createAssignment")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label={t("examAssignment.form.exam")}
            error={errors.exam?.message}
            required
          >
            <Select
              value={watch("exam")}
              onValueChange={(v) => setValue("exam", v)}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("examAssignment.form.selectExam")}
                />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e._id} value={e._id}>
                    {e.name} ({e.uid})
                  </SelectItem>
                ))}
                {exams.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">
                    {t("examAssignment.form.noPublishedExams")}
                  </div>
                )}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t("examAssignment.form.program")}>
            <Select
              value={watch("program") || "_none_"}
              onValueChange={(v) => {
                setValue("program", v === "_none_" ? "" : v);
                setValue("batch", "");
                setValue("prerequisite_components", []);
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("examAssignment.form.selectProgram")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">{t("common.none")}</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {watchedProgram && watchedProgram !== "_none_" && watchedProgram !== "" && (
            <FormField label={t("examAssignment.form.batch")}>
              <Select
                value={watch("batch") || "_none_"}
                onValueChange={(v) =>
                  setValue("batch", v === "_none_" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("examAssignment.form.selectBatch")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">{t("common.none")}</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {watchedProgram && watchedProgram !== "_none_" && watchedProgram !== "" && (
            <FormField label={t("examAssignment.form.prerequisiteModules")}>
              <SearchableMultiSelect
                items={components}
                selected={components.filter((c) =>
                  (watch("prerequisite_components") || []).includes(c._id),
                )}
                onChange={(newSelected) =>
                  setValue(
                    "prerequisite_components",
                    newSelected.map((c) => c._id),
                  )
                }
                onSearch={() => {}}
                placeholder={t("examAssignment.form.selectPrerequisiteModules")}
                searchPlaceholder={t("examAssignment.form.searchModules")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("examAssignment.form.prerequisiteModulesHelp")}
              </p>
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("examAssignment.form.startDate")}
              error={errors.start_date?.message}
              required
            >
              <input
                {...register("start_date")}
                type="datetime-local"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </FormField>
            <FormField
              label={t("examAssignment.form.endDate")}
              error={errors.end_date?.message}
              required
            >
              <input
                {...register("end_date")}
                type="datetime-local"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </FormField>
          </div>

          <FormActions
            onCancel={onClose}
            submitLabel={isEdit ? t("common.update") : t("common.create")}
            isLoading={createAssignment.isPending || updateAssignment.isPending}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentForm;
