import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import {
  StickyNote,
  Plus,
  Loader2,
  Paperclip,
  FileText,
  Trash2,
  Download,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useCreateStudentPersonalNote } from "@/store/useThesisStore";
import { uploadFile } from "@/api/uploadApi";
import { downloadSecureFile } from "@/utils/secureFile";
import { useSecureHtml } from "@/hooks/useSecureHtml";
import { cn } from "@/lib/utils";

const isEmptyHtml = (html) => {
  const plain = String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return !plain;
};

const NoteHtml = ({ html, className = "" }) => {
  const secureHtml = useSecureHtml(html);
  if (isEmptyHtml(html)) return null;
  return (
    <div
      className={cn(
        "text-foreground/90 text-xs leading-relaxed break-words [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md",
        className
      )}
      dangerouslySetInnerHTML={{ __html: secureHtml }}
    />
  );
};

export default function StudentPersonalNotesCard({
  thesisId,
  trajectoryId,
  userId,
  notes = [],
  steps = [],
  canModify = true,
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [mode, setMode] = useState("general"); // general | step
  const [selectedStepId, setSelectedStepId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const createNoteMutation = useCreateStudentPersonalNote();

  const stepOptions = useMemo(
    () =>
      (steps || []).filter((step) => step && !step.removed && step._id && step.name),
    [steps]
  );

  const resetForm = () => {
    setMode("general");
    setSelectedStepId("");
    setNoteText("");
    setAttachments([]);
    setIsUploading(false);
  };

  const canSend =
    (!isEmptyHtml(noteText) || attachments.length > 0) &&
    (mode === "general" || Boolean(selectedStepId)) &&
    !isUploading &&
    !createNoteMutation.isPending;

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const res = await uploadFile(file);
        const fileUrl =
          res?.data?.url || res?.url || res?.data?.file_url || res?.file_url;
        if (fileUrl) {
          const docName = file.name.replace(/\.[^/.]+$/, "") || file.name;
          setAttachments((prev) => [
            ...prev,
            { name: docName, file_url: fileUrl },
          ]);
        }
      }
      toast.success(t("common.uploadSuccess", "File uploaded successfully"));
    } catch (err) {
      toast.error(
        err?.message ||
          t("thesisManagement.personalNotes.uploadFailed", "Failed to upload file")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!canSend) return;

    try {
      await createNoteMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        note: isEmptyHtml(noteText) ? "" : noteText,
        step: mode === "step" ? selectedStepId : null,
        attachments,
      });
      resetForm();
      setIsAddOpen(false);
    } catch {
      // Error handled by store hook
    }
  };

  const handleDownload = async (url, filename) => {
    if (!url) return;
    try {
      await downloadSecureFile(url, filename || url.split("/").pop());
    } catch (error) {
      toast.error(
        error?.message ||
          t("thesisManagement.personalNotes.downloadFailed", "Failed to download file")
      );
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <StickyNote className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                {t("thesisManagement.personalNotes.title", "Personal Notes")}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {notes.length}
              </span>
            </div>
          </div>
          {canModify && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              {t("thesisManagement.personalNotes.addNote", "Add Note")}
            </Button>
          )}
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <StickyNote className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">
              {t(
                "thesisManagement.personalNotes.empty",
                "No personal notes added yet."
              )}
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              {t(
                "thesisManagement.personalNotes.emptyDesc",
                "Notes added here will be visible on the student's thesis page."
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {notes.map((item, idx) => {
              const creator = item.created_by;
              const creatorName = creator
                ? `${creator.first_name || ""} ${creator.last_name || ""}`.trim() ||
                  creator.email ||
                  t("thesisManagement.personalNotes.staffMember", "Staff")
                : t("thesisManagement.personalNotes.staffMember", "Staff");

              const initials = creator
                ? `${creator.first_name?.[0] || ""}${creator.last_name?.[0] || ""}`.toUpperCase() ||
                  "S"
                : "S";

              const stepName = item.step?.name;
              const files = Array.isArray(item.attachments) ? item.attachments : [];

              return (
                <div
                  key={item._id || idx}
                  className="bg-muted/30 border border-border/50 rounded-lg p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="w-5 h-5 text-[10px]">
                        <AvatarImage src={creator?.avatar} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground truncate text-[11px]">
                        {creatorName}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {moment(item.createdAt).format("DD/MM/YYYY HH:mm")}
                    </span>
                  </div>

                  {stepName ? (
                    <span className="inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary">
                      {t("thesisManagement.personalNotes.step", "Step")}: {stepName}
                    </span>
                  ) : null}

                  <NoteHtml html={item.note} />

                  {files.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {t(
                          "thesisManagement.personalNotes.attachments",
                          "Attachments"
                        )}
                      </p>
                      {files.map((file, fileIdx) => (
                        <button
                          key={`${item._id || idx}-file-${fileIdx}`}
                          type="button"
                          className="w-full flex items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5 text-left hover:bg-muted/40 transition-colors"
                          onClick={() =>
                            handleDownload(file.file_url, file.name)
                          }
                        >
                          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[11px] font-medium truncate flex-1">
                            {file.name}
                          </span>
                          <Download className="w-3 h-3 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {t(
                "thesisManagement.personalNotes.modalTitle",
                "Note to student"
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="inline-flex rounded-full border border-border bg-muted/40 p-1 gap-1">
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  mode === "general"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  setMode("general");
                  setSelectedStepId("");
                }}
              >
                {t(
                  "thesisManagement.personalNotes.generalInfo",
                  "General info"
                )}
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  mode === "step"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMode("step")}
              >
                {t(
                  "thesisManagement.personalNotes.attachToStep",
                  "Attach to step"
                )}
              </button>
            </div>

            {mode === "step" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t("thesisManagement.personalNotes.step", "Step")}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedStepId || undefined}
                  onValueChange={setSelectedStepId}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue
                      placeholder={t(
                        "thesisManagement.personalNotes.selectStep",
                        "Select step"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {stepOptions.map((step) => (
                      <SelectItem
                        key={step._id}
                        value={String(step._id)}
                        className="text-xs"
                      >
                        {step.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="border rounded-md overflow-hidden bg-background">
              <RichTextEditor
                value={noteText}
                onChange={setNoteText}
                placeholder={t(
                  "thesisManagement.personalNotes.messageOptional",
                  "Message (optional)"
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  disabled={isUploading || createNoteMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5" />
                  )}
                  {t(
                    "thesisManagement.personalNotes.attachFiles",
                    "Attach files"
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "thesisManagement.personalNotes.sendHint",
                    "Send a message, one or more files, or both."
                  )}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {attachments.length > 0 ? (
                <div className="space-y-1.5">
                  {attachments.map((file, idx) => (
                    <div
                      key={`${file.file_url}-${idx}`}
                      className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-[11px] font-medium truncate flex-1">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddOpen(false);
                resetForm();
              }}
              disabled={createNoteMutation.isPending || isUploading}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={handleSaveNote}
              disabled={!canSend}
            >
              {createNoteMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {createNoteMutation.isPending
                ? t("common.saving", "Saving...")
                : t("thesisManagement.personalNotes.send", "Send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
