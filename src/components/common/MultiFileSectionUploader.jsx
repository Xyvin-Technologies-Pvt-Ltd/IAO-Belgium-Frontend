import React, { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2, Loader2, Trash2, Paperclip, Eye } from "lucide-react";
import { uploadFile } from "@/api/uploadApi";
import { toast } from "sonner";

export default function MultiFileSectionUploader({
  sectionKey,
  existingAttachments = [],
  onUploadSuccess,
  onRemoveAttachment,
  disabled = false,
  successToastMessage,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]); // [{ id, name, size, progress, phase }]

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return;

    const filesArray = Array.from(filesList);
    const newUploads = filesArray.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${file.name}`,
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      progress: 0,
      phase: "uploading",
    }));

    setUploadingFiles((prev) => [...prev, ...newUploads]);

    const uploadedResults = [];

    for (const item of newUploads) {
      try {
        const res = await uploadFile(item.file, (progressEvent) => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    progress: progressEvent.percent || 0,
                    phase: progressEvent.phase || "uploading",
                  }
                : f
            )
          );
        });

        const fileUrl = res?.data?.file_url || res?.url || res?.file_url || res?.data?.url;
        if (fileUrl) {
          uploadedResults.push({
            file_name: item.name,
            file_url: fileUrl,
            file_type: item.file.type || "DOCUMENT",
          });
        }
      } catch (err) {
        toast.error(`Failed to upload ${item.name}: ${err?.message || "Upload error"}`);
      }
    }

    // Remove finished uploads from local uploading state
    setUploadingFiles((prev) => prev.filter((f) => !newUploads.some((n) => n.id === f.id)));

    if (uploadedResults.length > 0 && onUploadSuccess) {
      onUploadSuccess(uploadedResults);
      if (successToastMessage !== false) {
        toast.success(
          successToastMessage ||
            `Successfully uploaded ${uploadedResults.length} document(s)`
        );
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Dropzone Container */}
      {!disabled && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]"
              : "border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-800/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span className="text-indigo-600 dark:text-indigo-400 underline">Click to upload</span> or drag and drop receipts/docs
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                PDF, PNG, JPG, DOCX up to 10MB (Multiple files allowed)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Files Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2 bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900">
          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            Uploading {uploadingFiles.length} file(s)...
          </p>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="space-y-1 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{file.name}</span>
                <span className="text-gray-400 text-[11px]">{file.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing Attached Files List */}
      {existingAttachments && existingAttachments.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Paperclip className="w-3 h-3 text-indigo-500" />
            Attached Documents ({existingAttachments.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {existingAttachments.map((doc, idx) => (
              <div
                key={doc._id || doc.file_url || idx}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate">
                    {doc.file_name || `Attachment #${idx + 1}`}
                  </span>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                    title="View Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                  {!disabled && onRemoveAttachment && (
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(doc)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
