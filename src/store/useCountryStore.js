
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

export const useCreateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCountry,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      toast.success(response?.message || "Country created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create country");
    },
  });
};

export const useUpdateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCountry(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      queryClient.invalidateQueries({ queryKey: ["country", variables.id] });
      toast.success(response?.message || "Country updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update country");
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
