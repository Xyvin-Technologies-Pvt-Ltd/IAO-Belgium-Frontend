import { Button } from "@/components/ui/button";
import { Download, FileText, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { getFileMetadata } from "@/api/filesApi";
import { openSecureFile, downloadSecureFile } from "@/utils/secureFile";
import { toast } from "sonner";

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const resolveProvidedSize = (size) => {
  if (typeof size === "number" && size > 0) return formatSize(size);
  if (typeof size === "string" && size.trim()) return size;
  return null;
};

const FileSize = ({ url, type, size: providedSize }) => {
  const [displaySize, setDisplaySize] = useState(() =>
    resolveProvidedSize(providedSize),
  );

  useEffect(() => {
    const resolved = resolveProvidedSize(providedSize);
    if (resolved) {
      setDisplaySize(resolved);
      return;
    }

    if (type === "link" || !url) {
      setDisplaySize("—");
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const bytes = await getFileMetadata(url);
        if (!cancelled) {
          setDisplaySize(bytes ? formatSize(bytes) : "—");
        }
      } catch {
        if (!cancelled) setDisplaySize("—");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [url, type, providedSize]);

  return (
    <span>
      {displaySize ?? <Skeleton className="h-4 w-12 inline-block" />}
    </span>
  );
};

const ListCard = ({ columns = [], data = [], isLoading = false }) => {
  const { t } = useTranslation();
  const handleView = async (item) => {
    if (!item.url) return;
    if (item.type === "link") {
      window.open(item.url, "_blank", "noopener,noreferrer");
    } else {
      try {
        await openSecureFile(item.url);
      } catch {
        toast.error("Failed to open file");
      }
    }
  };

  const handleDownload = async (item) => {
    if (!item.url) return;
    try {
      await downloadSecureFile(item.url, item.name || "download");
    } catch {
      toast.error("Failed to download file");
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg bg-card text-card-foreground shadow-sm p-4 md:p-6">
        <div className="hidden md:grid md:grid-cols-3 pb-4 gap-4">
          {columns.map((_, i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:items-center md:gap-4"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-5 w-48" />
              </div>
              <Skeleton className="h-5 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-full md:w-24" />
                <Skeleton className="h-10 w-full md:w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card text-card-foreground shadow-sm p-4 md:p-6">
      <div className="hidden md:grid md:grid-cols-3 text-base font-semibold pb-4 border-b border-border">
        {columns.map((col, i) => (
          <span key={i}>{col}</span>
        ))}
      </div>

      <div className="space-y-4 md:space-y-3 mt-4 md:mt-0">
        {data.map((item) => (
          <div
            key={item._id || item.id}
            className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:items-center md:gap-4 p-4 md:p-3 bg-muted/40 md:bg-transparent rounded-lg md:rounded-none border md:border-0 border-border"
          >
            <div className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate font-medium md:font-normal text-card-foreground">
                {item.name}
              </span>
            </div>

            <div className="text-base text-muted-foreground">
              <FileSize url={item.url} type={item.type} size={item.size} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleView(item)}
              >
                <Eye className="w-4 h-4" />
                {t("common.view")}
              </Button>
              {item?.type !== "link" && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => handleDownload(item)}
                >
                  <Download className="w-4 h-4" />
                  {t("common.download")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ListCard;

