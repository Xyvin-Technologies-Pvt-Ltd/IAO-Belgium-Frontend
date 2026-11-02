/**
 * YouTube URL helpers for thesis step videos.
 */

export const isYouTubeUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /(?:youtube\.com|youtu\.be)/i.test(url);
};

export const getYouTubeVideoId = (url) => {
  if (!url) return null;

  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1]?.split("?")[0] || null;
  }

  if (url.includes("/shorts/")) {
    return url.split("/shorts/")[1]?.split("?")[0] || null;
  }

  if (url.includes("youtube.com/watch")) {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get("v");
    } catch {
      const query = url.split("?")[1];
      if (!query) return null;
      return new URLSearchParams(query).get("v");
    }
  }

  if (url.includes("/embed/")) {
    return url.split("/embed/")[1]?.split("?")[0] || null;
  }

  return null;
};

export const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
};
