import { getBatchById, getStudentByBatch } from "@/api/batchApi";
import { useQuery } from "@tanstack/react-query";

export const useGetBatchesById = (id, options = {}) => {
  return useQuery({
    queryKey: ["batch", id],
    queryFn: () => getBatchById(id),
    staleTime: 30000,
    enabled: !!id,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
export const useGetStudentsByBatch = (id, options = {}) => {
  return useQuery({
    queryKey: ["students", "batch", id],
    queryFn: () => getStudentByBatch(id),
    staleTime: 30000,
    enabled: !!id,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
