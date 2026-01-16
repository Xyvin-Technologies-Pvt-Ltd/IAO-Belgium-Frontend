import {
  createLanguage,
  deleteLanguage,
  getLanguages,
  updateLanguage,
} from "@/api/languageApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetLanguages = (filter, options = {}) => {
  return useQuery({
    queryKey: ["languages", filter],
    queryFn: () => getLanguages(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLanguage,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      toast.success(response?.message || "Language created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create language");
    },
  });
};

export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateLanguage(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      queryClient.invalidateQueries({ queryKey: ["language", variables.id] });
      toast.success(response?.message || "Language updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update language");
    },
  });
};

export const useDeleteLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLanguage,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
      toast.success(response?.message || "Language deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete language");
    },
  });
};
