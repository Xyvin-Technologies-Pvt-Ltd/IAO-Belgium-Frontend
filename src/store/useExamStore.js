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
  startExamSession,
  endExamSession,
  getExamResults,
  getAdminExamResults,
  exportAdminExamResults,
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

export const useGetTeacherExamById = (exam_id, planning_id, options = {}) => {
  return useQuery({
    queryKey: ["teacher-exam", exam_id, planning_id],
    queryFn: () => getTeacherExamById(exam_id, planning_id),
    enabled: !!exam_id && !!planning_id,
    staleTime: 30000,
    ...options,
  });
};

export const useStartExamSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startExamSession,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-exam"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast.success(response?.message || "Exam session started successfully!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to start exam session");
    },
  });
};

export const useEndExamSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endExamSession,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-exam"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast.success(response?.message || "Exam session ended successfully!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to end exam session");
    },
  });
};

export const useGetExamResults = (
  exam_id,
  planning_id,
  params,
  options = {},
) => {
  return useQuery({
    queryKey: ["exam-results", exam_id, planning_id, params],
    queryFn: () => getExamResults(exam_id, planning_id, params),
    enabled: !!exam_id && !!planning_id,
    staleTime: 30000,
    ...options,
  });
};

export const useGetAdminExamResults = (params, options = {}) => {
  return useQuery({
    queryKey: ["admin-exam-results", params],
    queryFn: () => getAdminExamResults(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export { getAdminExamResults, exportAdminExamResults };
