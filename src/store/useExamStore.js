import {
  getExams,
  getExamsDropdown,
  getExamById,
  createExam,
  updateExam,
  publishExam,
  archiveExam,
  getTeacherExams,
  getTeacherExamById,
} from "@/api/examApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetExams = (params, options = {}) => {
  return useQuery({
    queryKey: ["exams", params],
    queryFn: () => getExams(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetExamsDropdown = (params, options = {}) => {
  return useQuery({
    queryKey: ["exams-dropdown", params],
    queryFn: () => getExamsDropdown(params),
    staleTime: 60000,
    ...options,
  });
};

export const useGetExamById = (id, options = {}) => {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: () => getExamById(id),
    enabled: !!id,
    staleTime: 30000,
    ...options,
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExam,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["exams-dropdown"] });
      toast.success(response?.message || "Exam created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create exam");
    },
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateExam(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["exam", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["exams-dropdown"] });
      toast.success(response?.message || "Exam updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update exam");
    },
  });
};

export const usePublishExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishExam,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["exam", variables] });
      queryClient.invalidateQueries({ queryKey: ["exams-dropdown"] });
      toast.success(response?.message || "Exam published successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to publish exam");
    },
  });
};

export const useArchiveExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveExam,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["exam", variables] });
      queryClient.invalidateQueries({ queryKey: ["exams-dropdown"] });
      toast.success(response?.message || "Exam archived successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to archive exam");
    },
  });
};

export const useGetTeacherExams = (params, options = {}) => {
  return useQuery({
    queryKey: ["teacher-exams", params],
    queryFn: () => getTeacherExams(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetTeacherExamById = (id, options = {}) => {
  return useQuery({
    queryKey: ["teacher-exam", id],
    queryFn: () => getTeacherExamById(id),
    enabled: !!id,
    staleTime: 30000,
    ...options,
  });
};
