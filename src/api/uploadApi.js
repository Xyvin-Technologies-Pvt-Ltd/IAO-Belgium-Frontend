import axiosInstance from "./axiosintercepter";

export const uploadFile = async (file) => {

  if (!file || file.size === 0) {
    console.error("[uploadApi] ❌ File is null or empty — aborting upload");
    throw new Error("File is empty or missing");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post("/upload", formData);
    return response.data;
  } catch (error) {
    console.error("[uploadApi] ❌ Upload failed:", error);
    throw error.response?.data || error;
  }
};
