import {
  getQuestionBanks,
  getQuestionBanksDropdown,
  getQuestionBankById,
  createQuestionBank,
  updateQuestionBank,
  deleteQuestionBank,
  getQuestions,
  getQuestionById,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUploadQuestions,
} from "@/api/questionBankApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetQuestionBanks = (params, options = {}) => {
  return useQuery({
    queryKey: ["question-banks", params],
    queryFn: () => getQuestionBanks(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetQuestionBanksDropdown = (params, options = {}) => {
  return useQuery({
    queryKey: ["question-banks-dropdown", params],
    queryFn: () => getQuestionBanksDropdown(params),
    staleTime: 60000,
    ...options,
  });
};

export const useGetQuestionBankById = (id, options = {}) => {
  return useQuery({
    queryKey: ["question-bank", id],
    queryFn: () => getQuestionBankById(id),
    enabled: !!id,
    staleTime: 30000,
    ...options,
  });
};

export const useCreateQuestionBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuestionBank,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["question-banks"] });
      queryClient.invalidateQueries({ queryKey: ["question-banks-dropdown"] });
      toast.success(response?.message || "Question bank created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create question bank");
    },
  });
};

export const useUpdateQuestionBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateQuestionBank(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["question-banks"] });
      queryClient.invalidateQueries({ queryKey: ["question-bank", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["question-banks-dropdown"] });
      toast.success(response?.message || "Question bank updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update question bank");
    },
  });
};

export const useDeleteQuestionBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionBank,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["question-banks"] });
      queryClient.invalidateQueries({ queryKey: ["question-banks-dropdown"] });
      toast.success(response?.message || "Question bank deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete question bank");
    },
  });
};

export const useGetQuestions = (questionBankId, params, options = {}) => {
  return useQuery({
    queryKey: ["questions", questionBankId, params],
    queryFn: () => getQuestions(questionBankId, params),
    enabled: !!questionBankId,
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetQuestionById = (questionBankId, questionId, options = {}) => {
  return useQuery({
    queryKey: ["question", questionBankId, questionId],
    queryFn: () => getQuestionById(questionBankId, questionId),
    enabled: !!questionBankId && !!questionId,
    staleTime: 30000,
    ...options,
  });
};

export const useAddQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionBankId, data }) => addQuestion(questionBankId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questions", variables.questionBankId],
      });
      queryClient.invalidateQueries({
        queryKey: ["question-bank", variables.questionBankId],
      });
      queryClient.invalidateQueries({ queryKey: ["question-banks"] });
      toast.success(response?.message || "Question added successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to add question");
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionBankId, questionId, data }) =>
      updateQuestion(questionBankId, questionId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questions", variables.questionBankId],
      });
      queryClient.invalidateQueries({
        queryKey: ["question", variables.questionBankId, variables.questionId],
      });
      toast.success(response?.message || "Question updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update question");
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionBankId, questionId }) =>
      deleteQuestion(questionBankId, questionId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questions", variables.questionBankId],
      });
      queryClient.invalidateQueries({
        queryKey: ["question-bank", variables.questionBankId],
      });
      queryClient.invalidateQueries({ queryKey: ["question-banks"] });
      toast.success(response?.message || "Question deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete question");
    },
  });
};

export const useBulkUploadQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionBankId, file }) =>
      bulkUploadQuestions(questionBankId, file),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questions", variables.questionBankId],
      });
      queryClient.invalidateQueries({
        queryKey: ["question-bank", variables.questionBankId],
      });
      queryClient.invalidateQueries({ queryKey: ["question-banks"] });
      toast.success(
        response?.message || `Imported ${response?.data?.imported || 0} questions`,
      );
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to import questions");
    },
  });
};
