import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDropzone } from "react-dropzone";
import { useAddStudentAttachment, useDeleteStudentAttachment } from "@/store/useIntakeStore";
import { FileText, Download, Trash2, UploadCloud, X, Loader2, StickyNote } from "lucide-react";
import moment from "moment";
import axiosInstance from "@/api/axiosintercepter";
import { downloadSecureFile } from "@/utils/secureFile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const StudentAttachments = ({ studentId, attachments }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);

  const addAttachmentMutation = useAddStudentAttachment();
  const deleteAttachmentMutation = useDeleteStudentAttachment();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast.error("File is larger than 10MB");
      } else if (error?.code === "file-invalid-type") {
        toast.error("Invalid file type. Only PDF, Word, Excel, and TXT files are allowed.");
      } else {
        toast.error(error?.message || "File upload failed");
      }
    },
  });

  const handleUpload = async () => {
    if (!file && !note.trim()) return;

    setIsUploadingFile(true);
    try {
      const attachmentData = {};

      if (note.trim()) {
        attachmentData.note = note.trim();
      }

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        // 1. Upload to S3 via backend
        const uploadRes = await axiosInstance.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (uploadRes.data?.data?.file_url) {
          attachmentData.file_url = uploadRes.data.data.file_url;
          attachmentData.filename = uploadRes.data.data.file_name;
          attachmentData.file_type = file.type || file.name.split(".").pop();
          
          if (fileDescription.trim()) {
            attachmentData.description = fileDescription.trim();
          }
        } else {
          throw new Error("Failed to upload file to storage server");
        }
      }

      // 2. Save note/attachment info to student profile
      await addAttachmentMutation.mutateAsync({
        studentId,
        data: attachmentData,
      });

      setFile(null);
      setNote("");
      setFileDescription("");
      toast.success(
        file 
          ? t("studentManagement.fileUploadedSuccess", "File uploaded successfully")
          : t("studentManagement.noteSavedSuccess", "Note saved successfully")
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to save note/attachment");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDelete = () => {
    if (attachmentToDelete) {
      deleteAttachmentMutation.mutate(
        { studentId, attachmentId: attachmentToDelete },
        { onSuccess: () => setAttachmentToDelete(null) }
      );
    }
  };

  const handleDownload = async (url, filename) => {
    if (!url) return;
    try {
      await downloadSecureFile(url, filename || url.split("/").pop());
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to download file"
      );
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Upload/Note Form */}
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-5 space-y-5">
        <h3 className="font-semibold text-sidebar-foreground">
          {t("studentManagement.addNoteOrAttachment", "Add Note & Attachment")}
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Note Input (Rich Text Editor) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-sidebar-foreground block">
              {t("studentManagement.note", "Note / General Comment")}
            </label>
            <RichTextEditor
              value={note}
              onChange={setNote}
              placeholder={t("studentManagement.notePlaceholder", "Write a rich text note here...")}
              className="bg-white dark:bg-white/5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* File Dropzone & Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-sidebar-foreground block">
                  {t("studentManagement.attachmentFile", "Attachment File (Optional)")}
                </label>
                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[120px] ${
                      isDragActive ? "border-[#ff8904] bg-[#ff8904]/5" : "border-sidebar-border hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud size={28} className="text-sidebar-foreground/50 mb-2" />
                    <p className="text-sm font-medium text-sidebar-foreground text-center">
                      Drag & drop a file here, or click to select
                    </p>
                    <p className="text-xs text-sidebar-foreground/50 mt-1 text-center">
                      Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT (Max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-xl p-4 border-sidebar-border flex flex-col justify-center min-h-[120px]">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={24} className="text-[#ff8904]" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-sidebar-foreground truncate max-w-[200px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-sidebar-foreground/50">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setFile(null); setFileDescription(""); }}
                        className="text-sidebar-foreground/50 hover:text-red-500 cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {file && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-sidebar-foreground block">
                    {t("studentManagement.fileDescription", "File Description (Optional)")}
                  </label>
                  <Input
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder={t("studentManagement.fileDescriptionPlaceholder", "Add a short description for this file")}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-end h-full pt-8">
              <Button 
                onClick={handleUpload} 
                disabled={(!file && !note.trim()) || isUploadingFile || addAttachmentMutation.isPending}
                className="w-full h-12"
              >
                {(isUploadingFile || addAttachmentMutation.isPending) && (
                  <Loader2 size={16} className="animate-spin mr-2" />
                )}
                {t("studentManagement.saveNoteAttachment", "Save Note / Attachment")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-5 space-y-4">
        <h3 className="font-semibold text-sidebar-foreground">
          {t("studentManagement.notesAndAttachmentsList", "Notes & Attachments")}
        </h3>
        
        {attachments?.length > 0 ? (
          <div className="space-y-3">
            {attachments.map((doc) => (
              <div key={doc._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sidebar-border rounded-lg p-4 bg-sidebar-accent/5">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-sidebar-foreground/70 shrink-0">
                    {doc.file_url ? <FileText size={20} /> : <StickyNote size={20} />}
                  </div>
                  <div className="min-w-0 space-y-1.5 flex-1">
                    {/* Render Note Description safely (HTML) */}
                    {doc.note ? (
                      <div 
                        className="text-sm text-sidebar-foreground prose dark:prose-invert max-w-none" 
                        dangerouslySetInnerHTML={{ __html: doc.note }}
                      />
                    ) : null}
                    
                    {/* Render File Info and optional description if present */}
                    {doc.filename && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#ff8904] bg-[#ff8904]/10 px-2 py-1 rounded w-fit">
                          <FileText size={12} />
                          <span className="truncate max-w-[250px] sm:max-w-[400px]">{doc.filename}</span>
                        </div>
                        {doc.description && (
                          <p className="text-xs text-sidebar-foreground/70 pl-1 italic">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-[11px] text-sidebar-foreground/50">
                      Uploaded on {moment(doc.uploaded_at).format("DD MMM YYYY")} 
                      {doc.uploaded_by && ` by ${doc.uploaded_by.first_name || ""} ${doc.uploaded_by.last_name || ""}`.trim()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {doc.file_url && (
                    <button
                      onClick={() => handleDownload(doc.file_url, doc.filename)}
                      className="flex items-center gap-1 text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors cursor-pointer"
                    >
                      <Download size={15} /> Download
                    </button>
                  )}
                  <button
                    onClick={() => setAttachmentToDelete(doc._id)}
                    disabled={deleteAttachmentMutation.isPending}
                    className="flex items-center gap-1 text-xs font-semibold text-red-500/70 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-sidebar-foreground/50 italic py-4">No notes or attachments found for this student.</p>
        )}
      </div>

      <Dialog open={!!attachmentToDelete} onOpenChange={(open) => !open && setAttachmentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attachment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attachment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachmentToDelete(null)} disabled={deleteAttachmentMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" className="bg-red-500 text-white hover:bg-red-600" onClick={handleDelete} disabled={deleteAttachmentMutation.isPending}>
              {deleteAttachmentMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAttachments;
