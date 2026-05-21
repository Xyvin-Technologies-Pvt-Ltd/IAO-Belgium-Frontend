import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDropzone } from "react-dropzone";
import { useAddTeacherAttachment, useDeleteTeacherAttachment } from "@/store/useTeacherStore";
import { FileText, Download, Trash2, UploadCloud, X, Loader2 } from "lucide-react";
import moment from "moment";
import axiosInstance from "@/api/axiosintercepter";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TeacherAttachments = ({ teacherId, attachments }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);

  const addAttachmentMutation = useAddTeacherAttachment();
  const deleteAttachmentMutation = useDeleteTeacherAttachment();

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
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // 1. Upload to S3 via backend
      const uploadRes = await axiosInstance.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.data?.data?.file_url) {
        // 2. Save attachment info to teacher profile
        await addAttachmentMutation.mutateAsync({
          teacherId,
          data: {
            file_url: uploadRes.data.data.file_url,
            filename: uploadRes.data.data.file_name,
            description: description.trim(),
            file_type: file.type || file.name.split(".").pop(),
          },
        });

        setFile(null);
        setDescription("");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to upload file");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDelete = () => {
    if (attachmentToDelete) {
      deleteAttachmentMutation.mutate(
        { teacherId, attachmentId: attachmentToDelete },
        { onSuccess: () => setAttachmentToDelete(null) }
      );
    }
  };

  const handleDownload = async (url, filename) => {
    if (!url) return;
    try {
      let downloadPath = url;
      try {
        const parsedUrl = new URL(url);
        downloadPath = parsedUrl.pathname;
      } catch {
        // relative path
      }
      const response = await axiosInstance.get(downloadPath, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || url.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Upload Area */}
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-5 space-y-4">
        <h3 className="font-semibold text-sidebar-foreground">Upload Attachment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragActive ? "border-[#ff8904] bg-[#ff8904]/5" : "border-sidebar-border hover:bg-sidebar-accent/50"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud size={32} className="text-sidebar-foreground/50 mb-3" />
              <p className="text-sm font-medium text-sidebar-foreground">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-xs text-sidebar-foreground/50 mt-1 text-center">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT (Max 10MB)
              </p>
            </div>
          ) : (
            <div className="border rounded-xl p-5 border-sidebar-border flex flex-col justify-center">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={24} className="text-[#ff8904]" />
                  <div>
                    <p className="text-sm font-semibold text-sidebar-foreground truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-sidebar-foreground/50">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-sidebar-foreground/50 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 flex flex-col justify-center">
            <div>
              <label className="text-sm font-medium text-sidebar-foreground mb-1 block">
                Description (Optional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description"
              />
            </div>
            
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploadingFile || addAttachmentMutation.isPending}
              className="w-full"
            >
              {(isUploadingFile || addAttachmentMutation.isPending) && (
                <Loader2 size={16} className="animate-spin mr-2" />
              )}
              Upload File
            </Button>
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-5 space-y-4">
        <h3 className="font-semibold text-sidebar-foreground">Attachments</h3>
        
        {attachments?.length > 0 ? (
          <div className="space-y-3">
            {attachments.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between border border-sidebar-border rounded-lg px-4 py-3 bg-sidebar-accent/5">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-sidebar-foreground/70" />
                  <div>
                    <p className="text-sm font-semibold text-sidebar-foreground">
                      {doc.filename}
                    </p>
                    {doc.description && (
                      <p className="text-xs text-sidebar-foreground/70 mt-0.5">
                        {doc.description}
                      </p>
                    )}
                    <p className="text-xs text-sidebar-foreground/50 mt-0.5">
                      Uploaded on {moment(doc.uploaded_at).format("DD MMM YYYY")} 
                      {doc.uploaded_by && ` by ${doc.uploaded_by.first_name || ""} ${doc.uploaded_by.last_name || ""}`.trim()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDownload(doc.file_url, doc.filename)}
                    className="flex items-center gap-1 text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    <Download size={15} /> Download
                  </button>
                  <button
                    onClick={() => setAttachmentToDelete(doc._id)}
                    disabled={deleteAttachmentMutation.isPending}
                    className="flex items-center gap-1 text-xs font-semibold text-red-500/70 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-sidebar-foreground/50 italic py-4">No attachments found for this teacher.</p>
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

export default TeacherAttachments;
