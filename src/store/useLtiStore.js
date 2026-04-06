import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getLtiTools,
  getLtiToolById,
  createLtiTool,
  updateLtiTool,
  deactivateLtiTool,
  getLtiPlatformConfig,
} from "@/api/ltiApi";

export const useGetLtiTools = (options = {}) =>
  useQuery({
    queryKey: ["lti-tools"],
    queryFn: getLtiTools,
    staleTime: 30000,
    ...options,
  });

export const useGetLtiToolById = (id, options = {}) =>
  useQuery({
    queryKey: ["lti-tool", id],
    queryFn: () => getLtiToolById(id),
    enabled: !!id,
    ...options,
  });

export const useGetLtiPlatformConfig = (options = {}) =>
  useQuery({
    queryKey: ["lti-platform-config"],
    queryFn: getLtiPlatformConfig,
    staleTime: 60000,
    ...options,
  });

export const useCreateLtiTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLtiTool,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["lti-tools"] });
      toast.success(res?.message || "LTI tool registered successfully");
    },
    onError: (err) => toast.error(err?.message || "Failed to register LTI tool"),
  });
};

export const useUpdateLtiTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateLtiTool(id, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["lti-tools"] });
      queryClient.invalidateQueries({ queryKey: ["lti-tool", id] });
      toast.success(res?.message || "LTI tool updated successfully");
    },
    onError: (err) => toast.error(err?.message || "Failed to update LTI tool"),
  });
};

export const useDeactivateLtiTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateLtiTool,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["lti-tools"] });
      toast.success(res?.message || "LTI tool deactivated");
    },
    onError: (err) => toast.error(err?.message || "Failed to deactivate LTI tool"),
  });
};
