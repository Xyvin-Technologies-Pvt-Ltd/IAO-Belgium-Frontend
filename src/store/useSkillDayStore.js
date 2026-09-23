import {
  getAllSkillDays,
  getSkillDayById,
  createSkillDay,
  updateSkillDay,
  deleteSkillDay,
  addAttachment,
  updateAttachment,
  removeAttachment,
  getAttachmentStudents,
} from "@/api/skillDayApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetSkillDays = (filter, options = {}) => {
  return useQuery({
    queryKey: ["skill-days", filter],
    queryFn: () => getAllSkillDays(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetSkillDayById = (id, options = {}) => {
  return useQuery({
    queryKey: ["skill-day", id],
    queryFn: () => getSkillDayById(id),
    enabled: !!id,
    staleTime: 30000,
    ...options,
  });
};

export const useCreateSkillDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSkillDay,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["skill-days"] });
      toast.success(response?.message || "Standalone Module created successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create Standalone Module");
    },
  });
};

export const useUpdateSkillDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSkillDay,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skill-days"] });
      queryClient.invalidateQueries({ queryKey: ["skill-day", variables.id] });
      toast.success(response?.message || "Standalone Module updated successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update Standalone Module");
    },
  });
};

export const useDeleteSkillDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSkillDay,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["skill-days"] });
      toast.success(response?.message || "Standalone Module deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete Standalone Module");
    },
  });
};

export const useAddAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addAttachment,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skill-days"] });
      queryClient.invalidateQueries({ queryKey: ["skill-day", variables.skillDayId] });
      toast.success(response?.message || "Group attached successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to attach group");
    },
  });
};

export const useUpdateAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAttachment,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skill-days"] });
      queryClient.invalidateQueries({ queryKey: ["skill-day", variables.skillDayId] });
      toast.success(response?.message || "Attachment updated successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update attachment");
    },
  });
};

export const useRemoveAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAttachment,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skill-days"] });
      queryClient.invalidateQueries({ queryKey: ["skill-day", variables.skillDayId] });
      toast.success(response?.message || "Attachment removed successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to remove attachment");
    },
  });
};

export const useGetAttachmentStudents = (skillDayId, attachmentId, options = {}) => {
  return useQuery({
    queryKey: ["skill-day-students", skillDayId, attachmentId],
    queryFn: () => getAttachmentStudents({ skillDayId, attachmentId }),
    enabled: !!skillDayId && !!attachmentId,
    staleTime: 10000,
    ...options,
  });
};
