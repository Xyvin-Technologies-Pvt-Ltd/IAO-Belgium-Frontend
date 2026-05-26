import { getStudentCornerConfig, updateStudentCornerConfig } from "@/api/studentCornerApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetStudentCornerConfig = (options = {}) => {
  return useQuery({
    queryKey: ["studentCornerConfig"],
    queryFn: () => getStudentCornerConfig(),
    staleTime: 30000,
    ...options,
  });
};

export const useUpdateStudentCornerConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStudentCornerConfig,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["studentCornerConfig"] });
      toast.success(response?.message || "Configuration updated successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update configuration");
    },
  });
};
