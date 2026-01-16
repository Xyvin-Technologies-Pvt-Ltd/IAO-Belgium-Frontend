import { createCity, deleteCity, getCities, updateCity } from "@/api/cityApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetCities = (filter, options = {}) => {
  return useQuery({
    queryKey: ["cities", filter],
    queryFn: () => getCities(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCity,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success(response?.message || "City created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create city");
    },
  });
};

export const useUpdateCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCity(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["city", variables.id] });
      toast.success(response?.message || "City updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update city");
    },
  });
};

export const useDeleteCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCity,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success(response?.message || "City deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete city");
    },
  });
};
