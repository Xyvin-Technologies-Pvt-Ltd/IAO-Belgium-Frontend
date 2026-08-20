
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  previewManualTherapieImport,
  confirmManualTherapieImport,
} from "@/api/manualTherapieImportApi";

export const usePreviewManualTherapieImport = () => {
  return useMutation({
    mutationFn: ({ file, programId, batchId }) =>
      previewManualTherapieImport(file, { programId, batchId }),
  });
};

export const useConfirmManualTherapieImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, batchId, students, dryRun }) =>
      confirmManualTherapieImport({ programId, batchId, students, dryRun }),
    onSuccess: (_, variables) => {
      if (!variables?.dryRun) {
        queryClient.invalidateQueries({ queryKey: ["student-list"] });
      }
    },
  });
};
