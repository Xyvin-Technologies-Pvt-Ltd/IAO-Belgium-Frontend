
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bulkUploadStudents } from "@/api/studentImportApi";

export const useBulkUploadStudents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, dryRun = false, intakeId }) =>
      bulkUploadStudents(file, { dryRun, intakeId }),
    onSuccess: (response, variables) => {
      //* Preview (dry-run) must not change data or fire a success toast.
      if (variables?.dryRun) return;
      queryClient.invalidateQueries({ queryKey: ["student-list"] });
      if (response?.data?.imported > 0) {
        toast.success(response?.message || "Students imported successfully!");
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to import students");
    },
  });
};
