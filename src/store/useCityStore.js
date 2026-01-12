
import { createCity, deleteCity, getCities, getCityById, updateCity } from "@/api/cityApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetCities = (filter) => {
  return useQuery({
    queryKey: ["cities", filter],
    queryFn: () => getCities(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useCityById = (id) => {
  return useQuery({
    queryKey: ["city", id],
    queryFn: () => getCityById(id),
    enabled: !!id,
    staleTime: 60000,
  });
};

export const useCreateCity = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCity,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create city");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useUpdateCity = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCity(id, data),
    onSuccess: (responseData, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["city", variables.id] });
      if (options.onSuccess) {
        options.onSuccess(responseData);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update city");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useDeleteCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    },
  });
};
