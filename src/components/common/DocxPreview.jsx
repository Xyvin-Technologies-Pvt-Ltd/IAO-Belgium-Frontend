import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { getSecureFileStreamHeaders } from "@/utils/secureFile";
import LoadingSpinner from "./LoadingSpinner";

const DocxPreview = ({ fileUrl }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileUrl || !containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;
    container.innerHTML = "";

    const loadDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(fileUrl, {
          headers: getSecureFileStreamHeaders(),
        });

        if (!response.ok) {
          throw new Error("Failed to load document");
        }

        const blob = await response.blob();
        if (cancelled) return;

        await renderAsync(blob, container, container, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: false,
          breakPages: true,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load document");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 px-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-auto bg-white dark:bg-gray-900">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 z-10">
          <LoadingSpinner size="lg" text="Loading document..." />
        </div>
      )}
      <div ref={containerRef} className="min-h-full p-4" />
    </div>
  );
};

export default DocxPreview;
