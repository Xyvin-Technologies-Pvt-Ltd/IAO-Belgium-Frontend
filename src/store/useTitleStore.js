import { createTitle, deleteTitle, getTitles, updateTitle } from "@/api/titleApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetTitles = (filter, options = {}) => {
  return useQuery({
    queryKey: ["titles", filter],
    queryFn: () => getTitles(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTitle,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["titles"] });
      toast.success(response?.message || "Title created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create title");
    },
  });
};

export const useUpdateTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTitle(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["titles"] });
      toast.success(response?.message || "Title updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update title");
    },
  });
};

export const useDeleteTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTitle,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["titles"] });
      toast.success(response?.message || "Title deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete title");
    },
  });
};
