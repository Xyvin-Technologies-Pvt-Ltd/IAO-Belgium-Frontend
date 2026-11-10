import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { toast } from "sonner";
import { Download, FileText, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { downloadSecureFile, openSecureFile } from "@/utils/secureFile";

const isStudentDoc = (doc) => doc && doc.source !== "backoffice";

const onTimeStatus = (uploadedAt, deadlineDate) => {
  if (!uploadedAt || !deadlineDate) return null;
  const uploaded = moment(uploadedAt);
  const deadlineEnd = moment(deadlineDate).endOf("day");
  if (!uploaded.isValid() || !deadlineEnd.isValid()) return null;
  return uploaded.isSameOrBefore(deadlineEnd) ? "on_time" : "late";
};

const TeacherStudentDocumentsCard = ({ steps = [] }) => {
  const { t } = useTranslation();
  const [downloadingAll, setDownloadingAll] = useState(false);

  const rows = useMemo(() => {
    const list = [];
    for (const step of steps || []) {
      if (
        step?.type !== "document_upload" &&
        step?.type !== "oral_defence"
      )
        continue;
      const docs = (step.documents || []).filter(isStudentDoc);
      for (const doc of docs) {
        list.push({
          id: doc._id,
          stepName: step.name || "—",
          deadlineDate: step.deadline_date || null,
          doc,
        });
      }
    }
    return list.sort((a, b) => {
      const aTime = a.doc.uploaded_at ? moment(a.doc.uploaded_at).valueOf() : 0;
      const bTime = b.doc.uploaded_at ? moment(b.doc.uploaded_at).valueOf() : 0;
      return bTime - aTime;
    });
  }, [steps]);

  const fileRows = rows.filter((row) => row.doc.kind !== "link" && row.doc.url);

  const handleOpenDoc = async (doc) => {
    if (!doc?.url) return;
    if (doc.kind === "link") {
      window.open(doc.url, "_blank", "noopener,noreferrer");
      return;
    }
    const filename = doc.file_name || doc.name || "document";
    try {
      await openSecureFile(doc.url, filename);
    } catch {
      toast.error(t("common.downloadFailed", "Could not open file"));
    }
  };

  const handleDownloadAll = async () => {
    if (!fileRows.length) {
      toast.message(
        t("thesis.noFilesToDownload", "No downloadable files available")
      );
      return;
    }
    setDownloadingAll(true);
    try {
      for (const row of fileRows) {
        const filename =
          row.doc.file_name || row.doc.name || "document";
        await downloadSecureFile(row.doc.url, filename);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch {
      toast.error(t("common.downloadFailed", "Could not download files"));
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-base font-bold text-foreground">
          {t("thesis.studentDocuments", "Student documents")}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2"
          disabled={downloadingAll || fileRows.length === 0}
          onClick={handleDownloadAll}
        >
          {downloadingAll ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {t("thesis.downloadAll", "Download all")}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          {t(
            "thesis.noStudentDocuments",
            "No documents uploaded yet by the student."
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  {t("thesis.columnStep", "Step")}
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  {t("thesis.columnDocument", "Document")}
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  {t("thesis.columnUploaded", "Uploaded")}
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground w-[120px]">
                  {t("thesis.columnStatus", "Status")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const doc = row.doc;
                const isLink = doc.kind === "link";
                const title =
                  doc.file_name || doc.name || (isLink ? "Link" : "File");
                const status = onTimeStatus(doc.uploaded_at, row.deadlineDate);

                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm text-foreground align-middle">
                      {row.stepName}
                    </TableCell>
                    <TableCell className="align-middle">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline text-left max-w-full"
                        onClick={() => handleOpenDoc(doc)}
                        title={title}
                      >
                        {isLink ? (
                          <Link2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <Download className="w-4 h-4 shrink-0" />
                        )}
                        <span className="truncate">{title}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground align-middle whitespace-nowrap">
                      {doc.uploaded_at
                        ? moment(doc.uploaded_at).format("DD-MM-YYYY HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="align-middle">
                      {status === "on_time" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {t("thesis.onTime", "On time")}
                        </span>
                      ) : status === "late" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                          {t("thesis.late", "Late")}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {rows.length > 0 ? (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          {t("thesis.studentDocumentsHint", "{{count}} document(s)", {
            count: rows.length,
          })}
        </p>
      ) : null}
    </div>
  );
};

export default TeacherStudentDocumentsCard;
