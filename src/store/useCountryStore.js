
import { createCountry, deleteCountry, getCountry, getCountryById, updateCountry } from "@/api/countryApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetCountries = (filter) => {
  return useQuery({
    queryKey: ["countries", filter],
    queryFn: () => getCountry(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useCountryById = (id) => {
  return useQuery({
    queryKey: ["country", id],
    queryFn: () => getCountryById(id),
    enabled: !!id,
    staleTime: 60000,
  });
};

export const useCreateCountry = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCountry,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create country");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useUpdateCountry = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCountry(id, data),
    onSuccess: (responseData, variables) => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      queryClient.invalidateQueries({ queryKey: ["country", variables.id] });
      if (options.onSuccess) {
        options.onSuccess(responseData);
      }
    },
    onError: (error) => {
      console.log(error);
      toast.error(error?.error?.message || "Failed to update country");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      queryClient.invalidateQueries({ queryKey: ["country"] });

    },
  });
};
