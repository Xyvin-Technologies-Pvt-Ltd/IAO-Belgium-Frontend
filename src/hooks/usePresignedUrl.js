import { useQuery, useQueries } from "@tanstack/react-query";
import { getPresignedUrl } from "@/api/filesApi";

//* Presigned URLs default to a 15 min lifetime on the backend; keep them fresh
//* in cache for 10 min so repeated renders don't re-request, then refetch.
const STALE_TIME = 10 * 60 * 1000;
const GC_TIME = 12 * 60 * 1000;

//* Resolve a single stored file reference into a temporary presigned URL.
export const usePresignedUrl = (keyOrUrl, options = {}) => {
  const { download = false, filename, enabled = true, ...rest } = options;

  return useQuery({
    queryKey: ["presignedUrl", keyOrUrl, download, filename || null],
    queryFn: () => getPresignedUrl(keyOrUrl, { download, filename }),
    enabled: enabled && Boolean(keyOrUrl),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

//* Resolve several references at once (e.g. a list/grid of attachments).
export const usePresignedUrls = (keys = [], options = {}) => {
  const { download = false } = options;

  return useQueries({
    queries: (keys || []).filter(Boolean).map((keyOrUrl) => ({
      queryKey: ["presignedUrl", keyOrUrl, download, null],
      queryFn: () => getPresignedUrl(keyOrUrl, { download }),
      enabled: Boolean(keyOrUrl),
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });
};
