import { getStudentByApplication } from "@/api/studentApi";
import { useQuery } from "@tanstack/react-query";

export const useGetStudentByApplication = (applicationId, options = {}) => {
  return useQuery({
    queryKey: ["student", applicationId],
    queryFn: () => getStudentByApplication(applicationId),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
