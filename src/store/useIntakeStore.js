import {
  createIntake,
  deleteIntake,
  getBatchByIntake,
  getEnrolledStudentsByIntake,
  getIntakeById,
  getIntakes,
  getStudentByApplication,
  updateintake,
  moveStudentToAnotherBatch,
  markStudentAsFailed,
  reEnrollStudent,
  getBatchesByProgram,
} from "@/api/intakeApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosintercepter";

export const useGetIntakes = (academicId, filter, options = {}) => {
  return useQuery({
    queryKey: ["intakes", academicId, filter],
    queryFn: () => getIntakes(academicId, filter),
    staleTime: 30000,
    enabled: !!academicId, // Only run query if academicId exists
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useGetIntakeById = (id, options = {}) => {
  return useQuery({
    queryKey: ["intake", id],
    queryFn: () => getIntakeById(id),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetBatchesByIntake = (intakeId,filter, options = {}) => {
  return useQuery({
    queryKey: ["batches", "intake", intakeId,filter],
    queryFn: () => getBatchByIntake(intakeId,filter),
    staleTime: 30000,
    enabled: !!intakeId,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetEnrolledStudentsByIntake = (intakeId,filter, options = {}) => {
  return useQuery({
    queryKey: ["enrollments", "intake", intakeId,filter],
    queryFn: () => getEnrolledStudentsByIntake(intakeId,filter),
    staleTime: 30000,
    enabled: !!intakeId, // Only run query if intakeId exists
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useCreateIntake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIntake,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["intakes"] });
      toast.success(response?.message || "Intake created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create intake");
    },
  });
};

export const useUpdateIntake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateintake(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["intakes"] });
      queryClient.invalidateQueries({ queryKey: ["intake", variables.id] });
      toast.success(response?.message || "Intake updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update intake");
    },
  });
};

export const useDeleteIntake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteIntake,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["intakes"] });
      toast.success(response?.message || "Intake deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete intake");
    },
  });
};
export const useGetStudentByApplication = (applicationId, filter = {}, options = {}) => {
  return useQuery({
    queryKey: ["student", applicationId, filter],
    queryFn: () => getStudentByApplication(applicationId, filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useMoveStudentToAnotherBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, targetBatchId }) => 
      moveStudentToAnotherBatch(applicationId, { target_batch_id: targetBatchId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast.success(response?.message || "Student moved successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to move student");
    },
  });
};

export const useMarkStudentAsFailed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, reason }) =>
      markStudentAsFailed(applicationId, { reason }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch-year-log"] });
      toast.success(response?.message || "Student marked as failed successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to mark student as failed");
    },
  });
};

export const useReEnrollStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, targetBatchId, failedYear, reason }) =>
      reEnrollStudent(applicationId, {
        target_batch_id: targetBatchId,
        failed_year: failedYear,
        reason,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast.success(response?.message || "Student re-enrolled successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to re-enroll student");
    },
  });
};

export const useGetBatchesByProgram = (programId, options = {}) => {
  return useQuery({
    queryKey: ["batches", "program", programId],
    queryFn: () => getBatchesByProgram(programId),
    staleTime: 30000,
    enabled: !!programId,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useAddStudentAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, data }) => {
      const response = await axiosInstance.post(`/user/student/${studentId}/attachments`, data);
      return response.data;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to add attachment");
    },
  });
};

export const useDeleteStudentAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, attachmentId }) => {
      const response = await axiosInstance.delete(`/user/student/${studentId}/attachments/${attachmentId}`);
      return response.data;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to delete attachment");
    },
  });
};
