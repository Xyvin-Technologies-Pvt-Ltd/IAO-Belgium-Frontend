
import axiosInstance from "./axiosintercepter";

export const bulkUploadStudents = async (
  file,
  { dryRun = false, intakeId } = {},
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (intakeId) formData.append("intake_id", intakeId);
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
