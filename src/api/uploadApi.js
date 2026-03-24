import axiosInstance from "./axiosintercepter";

export const uploadFile = async (file) => {
  // 3. Log file received as parameter
  console.log("[uploadApi] uploadFile called with:", file);
  console.log("[uploadApi] file name:", file?.name, "| size:", file?.size, "| type:", file?.type);

  if (!file || file.size === 0) {
    console.error("[uploadApi] ❌ File is null or empty — aborting upload");
    throw new Error("File is empty or missing");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    // 3. Log FormData entries
    console.log("[uploadApi] FormData entries:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File { name: "${value.name}", size: ${value.size}, type: "${value.type}" }`);
      } else {
        console.log(`  ${key}:`, value);
      }
    }

    // ✅ Do NOT set Content-Type manually — let Axios set it with the correct boundary
    const response = await axiosInstance.post("/upload", formData);

    console.log("[uploadApi] ✅ Upload success:", response.data);
    return response.data;
  } catch (error) {
    console.error("[uploadApi] ❌ Upload failed:", error);
    throw error.response?.data || error;
  }
};
