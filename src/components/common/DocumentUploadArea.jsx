import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Info, CloudUpload, X } from "lucide-react";

const DocumentUploadArea = ({
  fileType = "document",
  title,
  acceptedFormats,
  isOptional = false,
  isMultiple = false,
  uploadedFile,
  uploadedFiles,
  existingFile,
  existingFiles,
  onFileUpload,
  onRemoveFile,
  onRemoveExistingFile,
  onDragOver,
  onDrop,
  accept = ".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip",
}) => {
  const { t } = useTranslation();

  const files = isMultiple ? uploadedFiles || [] : null;
  const existingDocs = isMultiple ? existingFiles || [] : null;
  const showExistingWithNew = typeof onRemoveExistingFile === "function";
  const showExistingDocs =
    isMultiple &&
    existingDocs &&
    existingDocs.length > 0 &&
    (showExistingWithNew || (files && files.length === 0));

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center gap-1.5">
          <Label className="text-xs sm:text-sm font-semibold text-foreground">
            {title}
          </Label>
          {!isOptional && <span className="text-destructive font-bold">*</span>}
        </div>
      )}

      {acceptedFormats && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-2 rounded-lg">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            {t("documentUpload.acceptedDocuments", "Accepted formats")}: {acceptedFormats}
          </span>
        </div>
      )}

      {showExistingDocs && (
        <div className="space-y-2">
          {existingDocs.map((doc, index) => (
            <div
              key={`existing-${doc.url || index}`}
              className="border border-border bg-muted/30 rounded-xl p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-foreground truncate">
                    {doc.name || `${t("documentUpload.current", "Current")} ${title || "Document"} ${index + 1}`}
                  </p>
                </div>
              </div>
              {showExistingWithNew && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveExistingFile(fileType, index)}
                  className="h-7 text-xs"
                >
                  {t("documentUpload.removeFile", "Remove")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {isMultiple && files && files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`new-${file.name}-${index}`}
              className="border border-border bg-muted/30 rounded-xl p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveFile(fileType, index)}
                className="h-7 text-xs gap-1"
              >
                <X className="h-3 w-3" />
                {t("documentUpload.removeFile", "Remove")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div
        className="border-2 border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 rounded-xl p-6 sm:p-7 text-center transition-all duration-200"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop && onDrop(fileType, e)}
      >
        {!isMultiple && uploadedFile ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-xs mx-auto">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemoveFile && onRemoveFile(fileType)}
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
              {t("documentUpload.removeFile", "Remove file")}
            </Button>
          </div>
        ) : !isMultiple && existingFile?.url ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-xs sm:text-sm text-foreground">
                {existingFile.name || `${t("documentUpload.current", "Current")} ${title || "Document"}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("documentUpload.clickToReplace", "Upload a new file to replace")}
              </p>
            </div>
            <input
              type="file"
              id={`${fileType}-upload`}
              className="hidden"
              accept={accept}
              onChange={(e) => onFileUpload && onFileUpload(fileType, e)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                document.getElementById(`${fileType}-upload`)?.click()
              }
              className="h-8 text-xs"
            >
              {t("documentUpload.replaceFile", "Replace File")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CloudUpload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {t("documentUpload.chooseFile", "Choose a file or drag & drop it here")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {acceptedFormats || "Supported formats: PDF, DOC, DOCX, ZIP, PNG, JPG"}
              </p>
            </div>
            <div>
              <input
                type="file"
                id={`${fileType}-upload`}
                className="hidden"
                accept={accept}
                onChange={(e) => onFileUpload && onFileUpload(fileType, e)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-semibold"
                onClick={() =>
                  document.getElementById(`${fileType}-upload`)?.click()
                }
              >
                {isMultiple
                  ? t("documentUpload.browseFiles", "Browse Files")
                  : t("documentUpload.browseFile", "Browse File")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploadArea;
