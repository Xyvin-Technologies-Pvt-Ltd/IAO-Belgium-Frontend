
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { markAttendance } from "@/api/attendenceApi";

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAttendance,
    onSuccess: (data) => {
      toast.success(data.message || "Attendance marked successfully");
      // Invalidate student-component and planning-students queries to refetch with updated attendance
      queryClient.invalidateQueries({ queryKey: ["student-component"] });
      queryClient.invalidateQueries({ queryKey: ["planning-students"] });
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to mark attendance"
      );
    },
  });
};
