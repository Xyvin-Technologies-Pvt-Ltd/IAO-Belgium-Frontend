
import { createComponent, getComponentById, getComponents, getStudentsByComponent, updateComponent } from "@/api/componentApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetComponents = (filter, options = {}) => {
  return useQuery({
    queryKey: ["components", filter],
    queryFn: () => getComponents(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComponent,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      queryClient.invalidateQueries({ queryKey: ["program"] });
      toast.success(response?.message || "Component created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create component");
    },
  });
};

export const useUpdateComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateComponent(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      queryClient.invalidateQueries({ queryKey: ["program", variables.id] });
      toast.success(response?.message || "Component updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update component");
    },
  });
};

export const useGetStudentsByComponent=(id,filter,options={})=>{
  return useQuery({
    queryKey: ["student-component", id, filter],
    queryFn: () => getStudentsByComponent(id,filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    enabled: !!id, // Only run query when id is provided
    ...options,
  });
}

export const useGetComponentById=(id,options={})=>{
  return useQuery({
    queryKey: ["component", id],
    queryFn: () => getComponentById(id),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    enabled: !!id, // Only run query when id is provided
    ...options,
  });
}