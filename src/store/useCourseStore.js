import { createCourse, deleteCourse, getCourseById, getCourses, updateCourse } from "@/api/courseApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetCourses = (filter) => {
  return useQuery({
    queryKey: ["courses", filter],
    queryFn: () => getCourses(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useCourseById = (id) => {
  return useQuery({
    queryKey: ["course", id],
    queryFn: () => getCourseById(id),
    enabled: !!id,
    staleTime: 60000,
  });
};

export const useCreateCourse = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create course");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useUpdateCourse = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCourse(id, data),
    onSuccess: (responseData, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.id] });
      if (options.onSuccess) {
        options.onSuccess(responseData);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update course");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};
