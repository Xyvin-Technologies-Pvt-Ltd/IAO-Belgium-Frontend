import {
  getExams,
  getExamsDropdown,
  getExamById,
  createExam,
  updateExam,
  publishExam,
  archiveExam,
  getTeacherExams,
  getTeacherPracticalExams,
  getPracticalExamDetail,
  getPracticalExamStudents,
  getPracticalExamFeedback,
  upsertPracticalExamFeedback,
  getTeacherOtherExams,
  getOtherExamDetail,
  getOtherExamStudents,
  getTeacherExamById,
  startExamSession,
  endExamSession,
  getExamResults,
  getStudentAnswerSheet,
  getAdminExamResults,
  exportAdminExamResults,
  getAdminPracticalExamResults,
  exportAdminPracticalExamResults,
  getStudentPracticalDetailAdmin,
  setStudentPracticalScoreAdmin,
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

export const useGetTeacherOtherExams = (params, options = {}) => {
  return useQuery({
    queryKey: ["teacher-other-exams", params],
    queryFn: () => getTeacherOtherExams(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetOtherExamDetail = (exam_id, options = {}) => {
  return useQuery({
    queryKey: ["other-exam-detail", exam_id],
    queryFn: () => getOtherExamDetail(exam_id),
    enabled: !!exam_id,
    staleTime: 30000,
    ...options,
  });
};

export const useGetOtherExamStudents = (exam_id, params, options = {}) => {
  return useQuery({
    queryKey: ["other-exam-students", exam_id, params],
    queryFn: () => getOtherExamStudents(exam_id, params),
    enabled: !!exam_id,
    staleTime: 30000,
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

export const useGetStudentAnswerSheet = (attempt_id, options = {}) => {
  return useQuery({
    queryKey: ["student-answer-sheet", attempt_id],
    queryFn: () => getStudentAnswerSheet(attempt_id),
    enabled: !!attempt_id,
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

export const useGetTeacherPracticalExams = (params, options = {}) => {
  return useQuery({
    queryKey: ["teacher-practical-exams", params],
    queryFn: () => getTeacherPracticalExams(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetPracticalExamDetail = (id, options = {}) => {
  return useQuery({
    queryKey: ["practical-exam-detail", id],
    queryFn: () => getPracticalExamDetail(id),
    enabled: !!id,
    staleTime: 30000,
    ...options,
  });
};

export const useGetPracticalExamStudents = (id, params, options = {}) => {
  return useQuery({
    queryKey: ["practical-exam-students", id, params],
    queryFn: () => getPracticalExamStudents(id, params),
    enabled: !!id,
    staleTime: 30000,
    ...options,
  });
};

export const useGetPracticalExamFeedback = (id, applicationId, options = {}) => {
  return useQuery({
    queryKey: ["practical-exam-feedback", id, applicationId],
    queryFn: () => getPracticalExamFeedback(id, applicationId),
    enabled: !!id && !!applicationId,
    staleTime: 0,
    ...options,
  });
};

export const useUpsertPracticalExamFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, applicationId, payload }) =>
      upsertPracticalExamFeedback(id, applicationId, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["practical-exam-feedback", variables.id, variables.applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["practical-exam-students", variables.id],
      });
      toast.success(response?.message || "Feedback saved");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to save feedback");
    },
  });
};

export const useGetAdminPracticalExamResults = (params, options = {}) => {
  return useQuery({
    queryKey: ["admin-practical-exam-results", params],
    queryFn: () => getAdminPracticalExamResults(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetStudentPracticalDetailAdmin = (plannedId, applicationId, options = {}) => {
  return useQuery({
    queryKey: ["admin-practical-student-detail", plannedId, applicationId],
    queryFn: () => getStudentPracticalDetailAdmin(plannedId, applicationId),
    enabled: !!plannedId && !!applicationId,
    staleTime: 30000,
    ...options,
  });
};

export const useSetStudentPracticalScoreAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plannedId, applicationId, score }) =>
      setStudentPracticalScoreAdmin(plannedId, applicationId, score),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-practical-exam-results"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-practical-student-detail", variables.plannedId, variables.applicationId],
      });
      toast.success(response?.message || "Score saved successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to save score");
    },
  });
};

export { getAdminExamResults, exportAdminExamResults, exportAdminPracticalExamResults };
