import {
  createPlanning,
  deletePlanning,
  getPlannings,
  updatePlanning,
  getPlanningByTeacher,
  updateTeacherStatus,
  updatePracticalExamTeacherStatus,
  updateOnlineExamTeacherStatus,
  getPlanningByModule,
  getPlanningById,
  getPlanningStudents,
  exportPlanningsCsv,
  exportPlanningStudentsCsv,
} from "@/api/planningApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const triggerBlobDownload = (blobData, filename) => {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const useGetPlanning = (filter, options = {}) => {
  return useQuery({
    queryKey: ["planning", filter],
    queryFn: () => getPlannings(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetPlanningByTeacher = (filter, options = {}) => {
  return useQuery({
    queryKey: ["planning-teacher",filter],
    queryFn: () => getPlanningByTeacher(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreatePlanning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlanning,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      toast.success(response?.message || "Planning created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create planning");
    },
  });
};

export const useUpdatePlanning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updatePlanning(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      toast.success(response?.message || "Planning updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update planning");
    },
  });
};

export const useDeletePlanning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlanning,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      toast.success(response?.message || "Planning deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete planning");
    },
  });
};

export const useUpdateTeacherStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTeacherStatus(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["planning-teacher"] });
      queryClient.invalidateQueries({ queryKey: ["planning-module"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast.success(response?.message || "Status updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update status");
    },
  });
};

export const useUpdatePracticalExamTeacherStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updatePracticalExamTeacherStatus(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      queryClient.invalidateQueries({ queryKey: ["planning-teacher"] });
      queryClient.invalidateQueries({ queryKey: ["planning-module"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast.success(response?.message || "Status updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update status");
    },
  });
};

export const useUpdateOnlineExamTeacherStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateOnlineExamTeacherStatus(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      queryClient.invalidateQueries({ queryKey: ["planning-teacher"] });
      queryClient.invalidateQueries({ queryKey: ["planning-module"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast.success(response?.message || "Status updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update status");
    },
  });
};

export const useGetPlanningByModule = (filter, options = {}) => {
  return useQuery({
    queryKey: ["planning-module", filter],
    queryFn: () => getPlanningByModule(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetPlanningById=(id, options = {}) => {
  return useQuery({
    queryKey: ["planning", id],
    queryFn: () => getPlanningById(id),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

export const useGetPlanningStudents = (id, filter = {}, options = {}) => {
  return useQuery({
    queryKey: ["planning-students", id, filter],
    queryFn: () => getPlanningStudents(id, filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    enabled: !!id,
    ...options,
  });
};

export const useExportPlanningsCsv = () => {
  return useMutation({
    mutationFn: exportPlanningsCsv,
    onSuccess: (data) => {
      triggerBlobDownload(data, `plannings-report-${Date.now()}.csv`);
      toast.success("Planning CSV exported successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to export planning CSV");
    },
  });
};

export const useExportPlanningStudentsCsv = () => {
  return useMutation({
    mutationFn: exportPlanningStudentsCsv,
    onSuccess: (data, id) => {
      triggerBlobDownload(data, `planning-students-${id}.csv`);
      toast.success("Student list exported successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to export student list CSV");
    },
  });
};