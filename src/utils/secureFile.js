import { getPresignedUrl } from "@/api/filesApi";
import { useAuthStore } from "@/store/useAuthStore";

const baseURL = import.meta.env.VITE_APP_API_URL;
const apiKey = import.meta.env.VITE_APP_API_KEY;

const joinApiPath = (path) => {
  const root = (baseURL || "").replace(/\/+$/, "");
  const segment = String(path || "").replace(/^\/+/, "");
  return segment ? `${root}/${segment}` : root;
};

//* Same-origin stream URL for in-app viewers (pdf.js). Avoids S3 CORS.
export const buildSecureFileStreamUrl = (keyOrUrl) => {
  if (!keyOrUrl) return null;
  return `${joinApiPath("files/stream")}?key=${encodeURIComponent(keyOrUrl)}`;
};

//* Auth headers required by GET /files/stream (API key + JWT).
export const getSecureFileStreamHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "x-api-key": apiKey,
  };
};

const VIEWABLE_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "mp3",
  "wav",
  "ogg",
  "mp4",
  "webm",
  "ogv",
  "txt",
  "html",
  "xml",
];

export const isViewableFile = (keyOrUrl) => {
  if (!keyOrUrl) return false;
  const cleanPath = keyOrUrl.split("?")[0].split("#")[0];
  const extension = cleanPath.split(".").pop().toLowerCase();
  return VIEWABLE_EXTENSIONS.includes(extension);
};

//* Open a private file in a new tab via a short-lived presigned URL.
//* A blank tab is opened synchronously first so the browser does not block the
//* popup while we await the presigned URL. If the file type is not natively viewable
//* in the browser (e.g. .xlsx, .docx, .zip), it is downloaded directly instead.
export const openSecureFile = async (keyOrUrl, filename) => {
  if (!keyOrUrl) return;

  const viewable = isViewableFile(keyOrUrl);
  if (!viewable) {
    return downloadSecureFile(keyOrUrl, filename);
  }

  //* Open a placeholder tab synchronously (inside the click handler) so the
  //* popup isn't blocked while we await the presigned URL. NOTE: passing
  //* "noopener" here would make window.open return null, so we omit it and
  //* instead null out `opener` once we have the handle.
  const tab = window.open("about:blank", "_blank");
  if (tab) tab.opener = null;

  try {
    const url = await getPresignedUrl(keyOrUrl);
    if (!url) {
      tab?.close();
      return;
    }
    if (tab) {
      tab.location.href = url;
    } else {
      //* Popup was blocked; fall back to navigating the current tab.
      window.location.href = url;
    }
  } catch (error) {
    tab?.close();
    throw error;
  }
};

//* Download a private file via a presigned URL with attachment disposition.
//* No fetch()/blob() is used, so no S3 CORS configuration is required.
export const downloadSecureFile = async (keyOrUrl, filename) => {
  if (!keyOrUrl) return;

  let resolvedFilename = filename;
  if (resolvedFilename && !resolvedFilename.includes(".")) {
    const urlPath = keyOrUrl.split("?")[0];
    const extMatch = urlPath.match(/\.[a-zA-Z0-9]+$/);
    if (extMatch) {
      resolvedFilename = `${resolvedFilename}${extMatch[0]}`;
    }
  }

  const url = await getPresignedUrl(keyOrUrl, { download: true, filename: resolvedFilename });
  if (!url) return;

  const link = document.createElement("a");
  link.href = url;
  if (resolvedFilename) link.download = resolvedFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};
