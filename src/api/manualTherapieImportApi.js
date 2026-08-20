
import axiosInstance from "./axiosintercepter";

//* Step 1 — Upload xlsx, get back parsed student list for admin review.
//* No DB writes.
export const previewManualTherapieImport = async (file, { programId, batchId } = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (programId) formData.append("program_id", programId);
  if (batchId) formData.append("batch_id", batchId);
  try {
    const response = await axiosInstance.post(
      `/manual-therapie-import/preview`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

//* Step 2 — Confirm migration: create users, applications, availabilities,
//* and mark completed modules.
export const confirmManualTherapieImport = async ({
  programId,
  batchId,
  students,
  dryRun = false,
} = {}) => {
  try {
    const response = await axiosInstance.post(`/manual-therapie-import/confirm`, {
      program_id: programId,
      batch_id: batchId,
      students,
      dry_run: dryRun,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
