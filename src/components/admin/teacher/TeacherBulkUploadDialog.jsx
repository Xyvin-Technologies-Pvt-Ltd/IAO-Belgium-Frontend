import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, CheckCircle2, AlertTriangle, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBulkUploadTeachers } from "@/store/useTeacherStore";
import { downloadTeacherTemplate } from "@/api/teacherApi";

const ACCEPTED_EXT = [".xlsx", ".xls", ".csv"];

//* Maps the backend new_master_values keys to translated field labels.
const MASTER_FIELD_LABELS = {
  language: ["teacherManagement.modal.languageLabel", "Language of Instruction"],
  city: ["teacherManagement.modal.citiesLabel", "Cities"],
  academic_degree: [
    "teacherManagement.modal.academicDegreeLabel",
    "Academic Degree",
  ],
  teacher_role: ["teacherManagement.modal.teacherRoleLabel", "Lecturer Role"],
  contract_type: ["teacherManagement.modal.contractTypeLabel", "Contract Type"],
  department: ["teacherManagement.modal.departmentLabel", "Department"],
  region: ["teacherManagement.modal.regionLabel", "Region"],
  teaching_regions: [
    "teacherManagement.modal.teachingRegionsLabel",
    "Regions Where They Teach",
  ],
};

const TeacherBulkUploadDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef(null);
  const bulkUpload = useBulkUploadTeachers();

  const isPreviewing = bulkUpload.isPending && bulkUpload.variables?.dryRun;
  const isImporting = bulkUpload.isPending && !bulkUpload.variables?.dryRun;
  const isPreviewResult = result?.dry_run === true;
  const isImported = result && !result.dry_run && result.imported > 0;

  const newMasterEntries = result?.new_master_values
    ? Object.entries(result.new_master_values).filter(
        ([, values]) => Array.isArray(values) && values.length > 0,
      )
    : [];

  const resetState = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isValid = ACCEPTED_EXT.some((ext) => f.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      toast.error(
        t(
          "teacherManagement.bulkUpload.invalidFile",
          "Invalid file. Please upload an Excel (.xlsx) or CSV file.",
        ),
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(f);
    setResult(null);
  };

  const runUpload = async (dryRun) => {
    if (!file) return;
    try {
      const response = await bulkUpload.mutateAsync({ file, dryRun });
      setResult(response?.data || null);
    } catch (err) {
      if (err?.data) setResult(err.data);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      const blob = await downloadTeacherTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "teacher_import_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        t(
          "teacherManagement.bulkUpload.templateFailed",
          "Failed to download template",
        ),
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
            {t("teacherManagement.bulkUpload.title", "Bulk Upload Teachers")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              "teacherManagement.bulkUpload.description",
              "Upload an Excel file to import multiple teachers. Master-data columns (Language, Academic Degree, Department, etc.) accept names; separate multiple values with a comma. Unknown values are created automatically.",
            )}
          </p>

          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={downloading}
          >
            {downloading
              ? t("common.loading", "Loading...")
              : t(
                  "teacherManagement.bulkUpload.downloadTemplate",
                  "Download Template",
                )}
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
            >
              {t("teacherManagement.bulkUpload.selectFile", "Select File")}
            </Button>
            {file && (
              <p className="text-sm text-muted-foreground">{file.name}</p>
            )}
          </div>

          {result && (
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              {isPreviewResult && (
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  <Eye className="h-3.5 w-3.5" />
                  {t("teacherManagement.bulkUpload.previewLabel", "Preview - nothing saved yet")}
                </div>
              )}

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {isPreviewResult
                    ? `${t("teacherManagement.bulkUpload.wouldImport", "Would import")}: ${result.would_import ?? 0}`
                    : `${t("teacherManagement.bulkUpload.imported", "Imported")}: ${result.imported ?? 0}`}
                </span>
                {(isPreviewResult ? result.would_skip : result.skipped) > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    {isPreviewResult
                      ? `${t("teacherManagement.bulkUpload.wouldSkip", "Would skip")}: ${result.would_skip}`
                      : `${t("teacherManagement.bulkUpload.skipped", "Skipped")}: ${result.skipped}`}
                  </span>
                )}
              </div>

              {newMasterEntries.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-blue-600" />
                    {t(
                      "teacherManagement.bulkUpload.newMasterData",
                      isPreviewResult
                        ? "New values that will be created"
                        : "New values created",
                    )}
                  </p>
                  <div className="space-y-2">
                    {newMasterEntries.map(([field, values]) => {
                      const [key, fallback] =
                        MASTER_FIELD_LABELS[field] || [null, field];
                      return (
                        <div key={field} className="text-xs">
                          <span className="font-medium text-muted-foreground">
                            {key ? t(key, fallback) : fallback}:
                          </span>{" "}
                          <span className="inline-flex flex-wrap gap-1 align-middle">
                            {values.map((v) => (
                              <span
                                key={v}
                                className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 px-2 py-0.5"
                              >
                                {v}
                              </span>
                            ))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div>
                  <p className="font-medium text-foreground mb-1">
                    {t("teacherManagement.bulkUpload.errors", "Errors")}
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
              disabled={!file || bulkUpload.isPending}
            >
              {isPreviewing
                ? t("common.loading", "Loading...")
                : t("teacherManagement.bulkUpload.preview", "Preview")}
            </Button>
            <Button
              onClick={() => runUpload(false)}
              disabled={!file || bulkUpload.isPending}
            >
              {isImporting
                ? t("common.uploading", "Uploading...")
                : t("teacherManagement.bulkUpload.upload", "Upload")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherBulkUploadDialog;
