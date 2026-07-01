
import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Upload, CheckCircle2, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useGetAllPrograms, useGetBatches } from "@/store/useDropdownStore";
import { useBulkUploadStudents } from "@/store/useStudentImport";
import { downloadStudentTemplate } from "@/api/studentImportApi";

const ACCEPTED_EXT = [".xlsx", ".xls", ".csv"];

const StudentBulkUploadDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [program, setProgram] = useState("");
  const [batch, setBatch] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [previewedKey, setPreviewedKey] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef(null);
  const bulkUpload = useBulkUploadStudents();

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    { ...(programSearch && { search: programSearch }) },
    { enabled: open },
  );
  const programs = useMemo(
    () =>
      (programsData?.data || []).map((p) => ({
        _id: p._id,
        name: `${p.name}${p.city?.name ? ` - ${p.city.name}` : ""}${
          p.language?.name ? ` - ${p.language.name}` : ""
        }`,
      })),
    [programsData],
  );

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    program,
    {},
    { enabled: open && !!program },
  );
  const batches = batchesData?.data || [];

  const isPreviewing = bulkUpload.isPending && bulkUpload.variables?.dryRun;
  const isImporting = bulkUpload.isPending && !bulkUpload.variables?.dryRun;
  const isPreviewResult = result?.dry_run === true;
  const isImported = result && !result.dry_run && result.imported > 0;

  //* Identifies the current file+batch combination. The real Upload is only
  //* allowed once a successful preview has run for this exact combination.
  const currentKey = file && batch ? `${batch}::${file.name}::${file.size}` : null;
  const canUpload = !!currentKey && previewedKey === currentKey && !isImported;

  const resetFileState = () => {
    setFile(null);
    setResult(null);
    setPreviewedKey(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetFileState();
    setProgram("");
    setBatch("");
    onClose();
  };

  const handleProgramChange = (value) => {
    setProgram(value);
    setBatch("");
    setResult(null);
    setPreviewedKey(null);
  };

  const handleBatchChange = (value) => {
    setBatch(value);
    setResult(null);
    setPreviewedKey(null);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isValid = ACCEPTED_EXT.some((ext) =>
      f.name.toLowerCase().endsWith(ext),
    );
    if (!isValid) {
      toast.error(
        t(
          "studentImport.invalidFile",
          "Invalid file. Please upload an Excel (.xlsx) or CSV file.",
        ),
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(f);
    setResult(null);
    setPreviewedKey(null);
  };

  const runUpload = async (dryRun) => {
    if (!file || !batch) return;
    try {
      const response = await bulkUpload.mutateAsync({
        file,
        dryRun,
        batchId: batch,
      });
      setResult(response?.data || null);
      if (dryRun && response?.data) setPreviewedKey(currentKey);
    } catch (err) {
      if (err?.data) setResult(err.data);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      const blob = await downloadStudentTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_import_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        t("studentImport.templateFailed", "Failed to download template"),
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("studentImport.title", "Bulk Upload Students")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              "studentImport.description",
              "Select the program and batch, then upload an Excel/CSV file. Students are created with full access and no registration fee. Run a preview before importing.",
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableSelect
              label={t("studentImport.selectProgram", "Program")}
              placeholder={t("studentImport.selectProgram", "Program")}
              required
              items={programs}
              value={program}
              onChange={handleProgramChange}
              onSearch={setProgramSearch}
              isLoading={programsLoading}
            />
            <SearchableSelect
              label={t("studentImport.selectBatch", "Batch")}
              placeholder={
                program
                  ? t("studentImport.selectBatch", "Batch")
                  : t("studentImport.selectProgramFirst", "Select a program first")
              }
              required
              items={batches}
              value={batch}
              onChange={handleBatchChange}
              disabled={!program}
              isLoading={batchesLoading}
            />
          </div>

          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={downloading}
          >
            {downloading
              ? t("common.loading", "Loading...")
              : t("studentImport.downloadTemplate", "Download Template")}
          </Button>

          <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="h-10 w-10 text-muted-foreground" />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!batch}
            >
              {t("studentImport.selectFile", "Select File")}
            </Button>
            {!batch && (
              <p className="text-xs text-muted-foreground">
                {t(
                  "studentImport.selectBatchFirst",
                  "Select a program and batch before choosing a file.",
                )}
              </p>
            )}
            {file && (
              <p className="text-sm text-muted-foreground">{file.name}</p>
            )}
          </div>

          {result && (
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              {isPreviewResult && (
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  <Eye className="h-3.5 w-3.5" />
                  {t(
                    "studentImport.previewLabel",
                    "Preview - nothing saved yet",
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {isPreviewResult
                    ? `${t("studentImport.wouldImport", "Would import")}: ${result.would_import ?? 0}`
                    : `${t("studentImport.imported", "Imported")}: ${result.imported ?? 0}`}
                </span>
                {(isPreviewResult ? result.would_skip : result.skipped) > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    {isPreviewResult
                      ? `${t("studentImport.wouldSkip", "Would skip")}: ${result.would_skip}`
                      : `${t("studentImport.skipped", "Skipped")}: ${result.skipped}`}
                  </span>
                )}
              </div>

              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div>
                  <p className="font-medium text-foreground mb-1">
                    {t("studentImport.errors", "Errors")}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto text-muted-foreground">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {isImported
                ? t("common.close", "Close")
                : t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="outline"
              onClick={() => runUpload(true)}
              disabled={!file || !batch || bulkUpload.isPending}
            >
              {isPreviewing
                ? t("common.loading", "Loading...")
                : t("studentImport.preview", "Preview")}
            </Button>
            <Button
              onClick={() => runUpload(false)}
              disabled={!canUpload || bulkUpload.isPending}
              title={
                !canUpload
                  ? t(
                      "studentImport.previewRequired",
                      "Run a preview first before uploading.",
                    )
                  : undefined
              }
            >
              {isImporting
                ? t("common.uploading", "Uploading...")
                : t("studentImport.upload", "Upload")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentBulkUploadDialog;
