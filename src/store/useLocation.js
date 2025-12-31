
import { createLocation, deleteLocation, getLocationById, getLocations, updateLocation } from "@/api/locationApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetLocations = (filter) => {
  return useQuery({
    queryKey: ["locations", filter],
    queryFn: () => getLocations(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useLocationById = (id) => {
  return useQuery({
    queryKey: ["location", id],
    queryFn: () => getLocationById(id),
    enabled: !!id,
    staleTime: 60000,
  });
};

export const useCreateLocation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLocation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create location");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useUpdateLocation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateLocation(id, data),
    onSuccess: (responseData, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["location", variables.id] });
      if (options.onSuccess) {
        options.onSuccess(responseData);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update location");
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
};
