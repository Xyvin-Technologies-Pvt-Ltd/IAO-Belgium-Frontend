import {
  createPlanning,
  deletePlanning,
  getPlannings,
  updatePlanning,
  getPlanningByTeacher,
  updateTeacherStatus,
  getPlanningByModule,
  getPlanningById,
} from "@/api/planningApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
    queryKey: ["planning-teacher", filter],
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