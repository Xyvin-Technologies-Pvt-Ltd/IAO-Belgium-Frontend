
import axiosInstance from "./axiosintercepter";

export const bulkUploadStudents = async (
  file,
  { dryRun = false, batchId } = {},
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (batchId) formData.append("batch_id", batchId);
    if (dryRun) formData.append("dry_run", "true");
    const response = await axiosInstance.post(`/student-import/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const downloadStudentTemplate = async () => {
  const response = await axiosInstance.get(`/student-import/template`, {
    responseType: "blob",
  });
  return response.data;
};
