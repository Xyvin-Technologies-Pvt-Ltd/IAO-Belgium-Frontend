import axiosInstance from "./axiosintercepter";

export const getPresignedUrl = async (
  keyOrUrl,
  { download = false, filename } = {}
) => {
  if (!keyOrUrl) return null;

  const params = { key: keyOrUrl };
  if (download) params.download = true;
  if (filename) params.filename = filename;

  const response = await axiosInstance.get(`/files/presigned-url`, { params });
  return response.data?.data?.url || null;
};


export const getPresignedUrls = async (keys, { download = false } = {}) => {
  const unique = [...new Set((keys || []).filter(Boolean))];
  if (unique.length === 0) return {};

  const response = await axiosInstance.post(`/files/presigned-urls`, {
    keys: unique,
    download,
  });
  return response.data?.data?.urls || {};
};
