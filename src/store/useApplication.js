import { getApplications, updateApplication } from "@/api/applicationApi";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetApplications = (filter) => {
  return useQuery({
    queryKey: ["applications", filter],
    queryFn: () => getApplications(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateApplication(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(response?.message || "Application updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update application");
    },
  });
};
