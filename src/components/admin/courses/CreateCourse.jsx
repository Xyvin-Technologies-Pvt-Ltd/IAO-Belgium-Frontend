import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useCourseById, useCreateCourse, useUpdateCourse } from "@/store/useCourseStore";

const CreateCourse = ({ open, onClose, courseId }) => {
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
    }
  });

  const isEdit = !!courseId;
  const { data: course, isLoading, error, refetch } = useCourseById(courseId);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (course?.data && isEdit) {
      const courseData = course.data;
      Object.keys(courseData).forEach(key => {
        setValue(key, courseData[key]);
      });
    }
  }, [course, isEdit, setValue]);

  const onSubmit = (formData) => {
    const mutation = isEdit ? updateCourse : createCourse;
    const mutationData = isEdit ? { id: courseId, data: formData } : formData;
    
    mutation.mutate(mutationData, {
      onSuccess: () => {
        toast.success(`Course ${isEdit ? 'updated' : 'created'} successfully!`);
        handleClose();
      },
    });
  };

  if (!open) return null;

  const isSubmitting = createCourse.isLoading || updateCourse.isLoading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-100 p-6">
        <h2 className="text-xl font-bold">
          {isEdit ? "Edit Course" : "Create a new Course"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isEdit ? "Update the course details" : "Let's create a new course"}
        </p>

        {isEdit && isLoading ? (
          <LoadingState text="Loading course details..." />
        ) : isEdit && error ? (
          <ErrorMessage 
            message={error?.message || "Failed to load course details"}
            onRetry={refetch}
            variant="card"
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label="Course Name"
              placeholder="Enter Course Name"
              error={errors.name?.message}
              required
              {...register("name", { required: "Course name is required" })}
            />
            
            <FormField
              label="Description"
              placeholder="Enter Description"
              error={errors.description?.message}
              required
              {...register("description", { required: "Description is required" })}
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

export default CreateCourse;
