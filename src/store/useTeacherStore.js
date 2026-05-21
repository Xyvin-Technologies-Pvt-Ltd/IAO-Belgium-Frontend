import {
  createTeacher,
  deleteTeacher,
  getTeacher,
  getTeacherById,
  updateTeacher,
  getSessionsByTeacherId,
  addTeacherAttachment,
  deleteTeacherAttachment
} from "@/api/teacherApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetTeachers = (filter, options = {}) => {
  return useQuery({
    queryKey: ["teachers", filter],
    queryFn: () => getTeacher(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetTeacherById = (id, options = {}) => {
  return useQuery({
    queryKey: ["teacher", id],
    queryFn: () => getTeacherById(id),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useCreateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeacher,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success(response?.message || "Teacher created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create teacher");
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTeacher(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", variables.id] });
      toast.success(response?.message || "Teacher updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update teacher");
    },
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeacher,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success(response?.message || "Teacher deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete teacher");
    },
  });
};

export const useGetSessionsByTeacherId = (teacherId, params, options = {}) => {
  return useQuery({
    queryKey: ["teacher-sessions", teacherId, params],
    queryFn: () => getSessionsByTeacherId(teacherId, params),
    staleTime: 30000,
    enabled: !!teacherId,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useAddTeacherAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, data }) => addTeacherAttachment(teacherId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teacher", variables.teacherId] });
      toast.success(response?.message || "Attachment added successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to add attachment");
    },
  });
};

export const useDeleteTeacherAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, attachmentId }) => deleteTeacherAttachment(teacherId, attachmentId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teacher", variables.teacherId] });
      toast.success(response?.message || "Attachment deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete attachment");
    },
  });
};
