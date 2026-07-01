import { usePresignedUrl } from "@/hooks/usePresignedUrl";

//* References to our own uploaded files (proxy path or direct S3 URL).
const UPLOADED_FILE_PATTERN = /(\/upload\/|\.amazonaws\.com\/)/i;
//* Already-usable absolute references that should render as-is.
const ABSOLUTE_PATTERN = /^(https?:|data:|blob:)/i;

//* Renders an <img> from a private S3 object by first resolving a presigned URL.
//* Pass the stored reference via `fileKey` (preferred) or `src`.
//* External URLs (e.g. YouTube thumbnails) and data/blob URIs render directly.
//* `fallback` is rendered while loading or on error.
const SecureImage = ({
  fileKey,
  src,
  alt = "",
  fallback = null,
  className,
  ...imgProps
}) => {
  const reference = fileKey || src;

  //* Presign when it's one of our uploaded files or a bare object key;
  //* render directly when it's an external absolute URL.
  const needsPresign =
    Boolean(reference) &&
    (UPLOADED_FILE_PATTERN.test(reference) || !ABSOLUTE_PATTERN.test(reference));

  const { data: url, isLoading, isError } = usePresignedUrl(reference, {
    enabled: needsPresign,
  });

  if (!reference) return fallback;
  if (!needsPresign) {
    return <img src={reference} alt={alt} className={className} {...imgProps} />;
  }
  if (isError || isLoading || !url) return fallback;

  return <img src={url} alt={alt} className={className} {...imgProps} />;
};

export default SecureImage;
