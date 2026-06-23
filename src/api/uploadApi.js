import axiosInstance from "./axiosintercepter";

/** Client → server transfer maps to 0–90% of overall progress. */
const CLIENT_UPLOAD_WEIGHT = 90;

export const getUploadPercent = (progressEvent, fileSize) => {
  const total = progressEvent.total > 0 ? progressEvent.total : fileSize;
  if (!total || total <= 0) return 0;

  const sentRatio = Math.min(1, progressEvent.loaded / total);
  return Math.min(CLIENT_UPLOAD_WEIGHT, Math.round(sentRatio * CLIENT_UPLOAD_WEIGHT));
};

export const isClientUploadComplete = (progressEvent, fileSize) => {
  const total = progressEvent.total > 0 ? progressEvent.total : fileSize;
  return total > 0 && progressEvent.loaded >= total;
};

export const uploadFile = async (file, onUploadProgress) => {
  if (!file || file.size === 0) {
    console.error("[uploadApi] File is null or empty — aborting upload");
    throw new Error("File is empty or missing");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post("/upload", formData, {
      timeout: 4 * 60 * 60 * 1000,
      onUploadProgress: (event) => {
        const clientDone = isClientUploadComplete(event, file.size);

        onUploadProgress?.({
          ...event,
          percent: clientDone ? 92 : getUploadPercent(event, file.size),
          phase: clientDone ? "processing" : "uploading",
        });
      },
    });

    onUploadProgress?.({
      loaded: file.size,
      total: file.size,
      percent: 100,
      phase: "complete",
    });

    return response.data;
  } catch (error) {
    console.error("[uploadApi] Upload failed:", error);
    throw error.response?.data || error;
  }
};
