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
} from "@/api/intakeApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
export const useGetStudentByApplication = (applicationId, options = {}) => {
  return useQuery({
    queryKey: ["student", applicationId],
    queryFn: () => getStudentByApplication(applicationId),
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
