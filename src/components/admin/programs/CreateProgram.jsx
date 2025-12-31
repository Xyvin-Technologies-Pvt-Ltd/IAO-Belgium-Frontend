import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useCreateProgram, useProgramById, useUpdateProgram } from "@/store/useProgramStore";


const CreateProgram = ({ open, onClose, programId }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      duration: "",
      level: "",
      status: "active",
    },
  });

  const isEdit = !!programId;
  const { data: program, isLoading, error, refetch } = useProgramById(programId);
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (program?.data && isEdit) {
      const programData = program.data;
      Object.keys(programData).forEach((key) => {
        setValue(key, programData[key]);
      });
    }
  }, [program, isEdit, setValue]);

  const onSubmit = (formData) => {
    const mutation = isEdit ? updateProgram : createProgram;
    const mutationData = isEdit ? { id: programId, data: formData } : formData;

    mutation.mutate(mutationData, {
      onSuccess: () => {
        toast.success(`Program ${isEdit ? "updated" : "created"} successfully!`);
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createProgram.isLoading || updateProgram.isLoading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-100 p-6">
        <h2 className="text-xl font-bold">
          {isEdit ? "Edit Program" : "Create a new Program"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isEdit ? "Update the program details" : "Let's create a new program"}
        </p>

        {isEdit && isLoading ? (
          <LoadingState text="Loading program details..." />
        ) : isEdit && error ? (
          <ErrorMessage
            message={error?.message || "Failed to load program details"}
            onRetry={refetch}
            variant="card"
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label="Program Name"
              placeholder="Enter Program Name"
              error={errors.name?.message}
              required
              {...register("name", { required: "Program name is required" })}
            />

            <FormField
              label="Description"
              placeholder="Enter Description"
              error={errors.description?.message}
              required
              {...register("description", {
                required: "Description is required",
              })}
            />

            <FormField
              label="Duration"
              placeholder="Enter Duration (e.g., 6 months)"
              error={errors.duration?.message}
              required
              {...register("duration", { required: "Duration is required" })}
            />

            <FormActions
              onCancel={handleClose}
              isLoading={isSubmitting}
              isEdit={isEdit}
            />
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateProgram;
