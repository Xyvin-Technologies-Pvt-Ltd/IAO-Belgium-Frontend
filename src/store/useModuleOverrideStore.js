import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignStudentModule,
  markStudentModulePaid,
  removeStudentModule,
  searchModulesForAssign,
} from "@/api/moduleOverrideApi";
import { toast } from "sonner";

export const useSearchModulesForAssign = (params, options = {}) => {
  return useQuery({
    queryKey: ["module-override-search", params],
    queryFn: () => searchModulesForAssign(params),
    enabled: options.enabled !== false,
    ...options,
  });
};

export const useAssignStudentModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignStudentModule,
    onSuccess: () => {
      toast.success("Module assigned");
      queryClient.invalidateQueries({ queryKey: ["student"] });
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to assign module");
    },
  });
};

export const useRemoveStudentModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeStudentModule,
    onSuccess: () => {
      toast.success("Module removed");
      queryClient.invalidateQueries({ queryKey: ["student"] });
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to remove module");
    },
  });
};

export const useMarkStudentModulePaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markStudentModulePaid,
    onSuccess: () => {
      toast.success("Module marked as paid");
      queryClient.invalidateQueries({ queryKey: ["student"] });
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to mark module as paid");
    },
  });
};
