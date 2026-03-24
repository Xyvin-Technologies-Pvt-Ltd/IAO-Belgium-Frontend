import {
  getContracts,
  createContract,
  updateContract,
  getStudentsContracts,
} from "@/api/contractApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetContracts = (filter, options = {}) => {
  return useQuery({
    queryKey: ["contracts", filter],
    queryFn: () => getContracts(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};


export const useCreateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createContract,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success(response?.message || "Contract created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create contract");
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateContract(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success(response?.message || "Contract updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update contract");
    },
  });
};

export const useGetStudentsContracts = (filter, options = {}) => {
  return useQuery({
    queryKey: ["students-contracts", filter],
    queryFn: () => getStudentsContracts(filter),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

