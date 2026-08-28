import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createResitPlanning,
  updateResitPlanning,
  getResitPlannings,
  assignResitStudents,
  updateResitTeacherStatus,
} from "@/api/resitApi";

export const useGetResitPlannings = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["resit-plannings", params],
    queryFn: () => getResitPlannings(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateResitPlanning = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createResitPlanning,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["resit-plannings"] });
      toast.success(response?.message || "Resit planning created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create resit planning");
    },
  });
};

export const useUpdateResitPlanning = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateResitPlanning(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["resit-plannings"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-practical-exams"] });
      toast.success(response?.message || "Resit planning updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update resit planning");
    },
  });
};

export const useAssignResitStudents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignResitStudents,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin-exam-results"] });
      queryClient.invalidateQueries({ queryKey: ["admin-practical-exam-results"] });
      queryClient.invalidateQueries({ queryKey: ["resit-plannings"] });
      toast.success(response?.message || "Students assigned to resit successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to assign resit");
    },
  });
};

export const useUpdateResitTeacherStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateResitTeacherStatus(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-practical-exams"] });
      queryClient.invalidateQueries({ queryKey: ["resit-plannings"] });
      toast.success(response?.message || "Status updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update status");
    },
  });
};
