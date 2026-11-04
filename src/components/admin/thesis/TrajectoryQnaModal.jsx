import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { toast } from "sonner";
import {
  X,
  FileText,
  Cloud,
  Link as LinkIcon,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  Video,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/ui/RichTextEditor";
import FormActions from "@/components/ui/forms/FormActions";
import { uploadFile } from "@/api/uploadApi";
import { openSecureFile } from "@/utils/secureFile";
import {
  useCreateTrajectoryQnaAnnouncement,
  useUpdateTrajectoryQnaAnnouncement,
} from "@/store/useThesisStore";

export default function TrajectoryQnaModal({
  open,
  onClose,
  thesisId,
  trajectoryId,
  initialData = null,
  mode = "create", // "create" | "edit" | "view"
  onSuccess,
}) {
  const { t } = useTranslation();
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  const createMutation = useCreateTrajectoryQnaAnnouncement();
  const updateMutation = useUpdateTrajectoryQnaAnnouncement();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Form states
  const [audience, setAudience] = useState("after_purchase");
  const [isScheduled, setIsScheduled] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [videoCallLink, setVideoCallLink] = useState("");
  const [message, setMessage] = useState("");

  // Attachments, Videos & Links
  const [attachments, setAttachments] = useState([]);
  const [videos, setVideos] = useState([]);
  const [links, setLinks] = useState([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (initialData) {
      setAudience(initialData.audience || "after_purchase");
      setTitle(initialData.title || "");
      setMessage(initialData.message || "");
      setVideoCallLink(initialData.video_call_link || "");

      if (initialData.scheduled_at) {
        setIsScheduled(true);
        const m = moment(initialData.scheduled_at);
        setScheduledDate(m.format("YYYY-MM-DD"));
        setScheduledTime(m.format("HH:mm"));
      } else {
        setIsScheduled(false);
        setScheduledDate("");
        setScheduledTime("");
      }

      setAttachments(
        Array.isArray(initialData.attachments)
          ? initialData.attachments.map((a) => ({
              name: a.name || "",
              file_url: a.file_url || "",
            }))
          : []
      );

      setVideos(
        Array.isArray(initialData.videos)
          ? initialData.videos.map((v) => ({
              name: v.name || "",
              url: v.url || "",
            }))
          : []
      );

      setLinks(
        Array.isArray(initialData.links)
          ? initialData.links.map((l) => ({
              name: l.name || "",
              url: l.url || "",
            }))
          : []
      );
    } else {
      setAudience("after_purchase");
      setIsScheduled(false);
      setTitle("");
      setScheduledDate("");
      setScheduledTime("");
      setVideoCallLink("");
      setMessage("");
      setAttachments([]);
      setVideos([]);
      setLinks([]);
    }
  }, [initialData, open]);

  const handleClose = () => {
    onClose();
  };

  // Upload file attachments
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setIsUploadingAttachment(true);
    try {
      for (const file of files) {
        const res = await uploadFile(file);
        const fileUrl =
          res?.data?.url || res?.url || res?.data?.file_url || res?.file_url;
        if (fileUrl) {
          const docName = file.name.replace(/\.[^/.]+$/, "");
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
          t("thesisManagement.qna.uploadFailed", "Failed to upload file")
      );
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleUpdateAttachmentName = (idx, newName) => {
    setAttachments((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, name: newName } : a))
    );
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Videos
  const handleAddVideo = () => {
    setVideos((prev) => [...prev, { name: "", url: "" }]);
  };

  const handleUpdateVideo = (idx, field, val) => {
    setVideos((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v))
    );
  };

  const handleRemoveVideo = (idx) => {
    setVideos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Links
  const handleAddLink = () => {
    setLinks((prev) => [...prev, { name: "", url: "" }]);
  };

  const handleUpdateLink = (idx, field, val) => {
    setLinks((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: val } : l))
    );
  };

  const handleRemoveLink = (idx) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t("thesisManagement.qna.titleRequired", "Title is required"));
      return;
    }

    let scheduled_at = null;
    if (isScheduled) {
      if (!scheduledDate) {
        toast.error(
          t(
            "thesisManagement.qna.dateRequired",
            "Please select a date for the scheduled session"
          )
        );
        return;
      }
      const timeStr = scheduledTime || "00:00";
      scheduled_at = new Date(`${scheduledDate}T${timeStr}`);
    }

    const payload = {
      audience,
      title: title.trim(),
      scheduled_at,
      video_call_link: videoCallLink.trim(),
      message,
      attachments: attachments.filter((a) => a.name && a.file_url),
      videos: videos.filter((v) => v.name && v.url),
      links: links.filter((l) => l.name || l.url),
    };

    if (isEditMode && initialData?._id) {
      updateMutation.mutate(
        { thesisId, trajectoryId, itemId: initialData._id, data: payload },
        {
          onSuccess: () => {
            onClose();
            if (onSuccess) onSuccess();
          },
        }
      );
    } else {
      createMutation.mutate(
        { thesisId, trajectoryId, data: payload },
        {
          onSuccess: () => {
            onClose();
            if (onSuccess) onSuccess();
          },
        }
      );
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-black border rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isViewMode
                  ? t("thesisManagement.qna.viewTitle", "Q&A Session / Announcement")
                  : isEditMode
                    ? t("thesisManagement.qna.editTitle", "Edit Q&A / Announcement")
                    : t("thesisManagement.qna.createTitle", "New Q&A / Announcement")}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {isViewMode ? (
            /* ================= VIEW MODE ================= */
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    initialData?.audience === "before_purchase"
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {initialData?.audience === "before_purchase"
                    ? t(
                        "thesisManagement.qna.beforePurchaseTitle",
                        "Eligible Students (Before & After Purchase)"
                      )
                    : t(
                        "thesisManagement.qna.afterPurchaseTitle",
                        "Enrolled Students Only (After Purchase)"
                      )}
                </span>

                {initialData?.scheduled_at ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {moment(initialData.scheduled_at).format("DD/MM/YYYY HH:mm")}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {t("thesisManagement.qna.announcement", "Announcement")}
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  {t("thesisManagement.qna.title", "Title")}
                </Label>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {initialData?.title}
                </h3>
              </div>

              {/* Video Call Link */}
              {initialData?.video_call_link && (
                <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Video className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t(
                          "thesisManagement.qna.videoCallLink",
                          "Video Meeting Link"
                        )}
                      </p>
                      <a
                        href={initialData.video_call_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary truncate hover:underline block"
                      >
                        {initialData.video_call_link}
                      </a>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    asChild
                    className="gap-1.5 shrink-0 bg-primary text-primary-foreground font-semibold"
                  >
                    <a
                      href={initialData.video_call_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t("common.join", "Join")}
                    </a>
                  </Button>
                </div>
              )}

              {/* Message Details */}
              {initialData?.message && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                    {t("thesisManagement.qna.message", "Details & Description")}
                  </Label>
                  <div
                    className="p-4 rounded-lg border bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 text-sm leading-relaxed prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: initialData.message }}
                  />
                </div>
              )}

              {/* Resources (Attachments, Videos, Links) */}
              {((initialData?.attachments?.length || 0) > 0 ||
                (initialData?.videos?.length || 0) > 0 ||
                (initialData?.links?.length || 0) > 0) && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900 dark:text-white">
                    {t("resourceModule.resources.title", "Resources")}
                  </Label>

                  <div className="space-y-2">
                    {initialData?.attachments?.map((file, idx) => (
                      <div
                        key={`att-${idx}`}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {file.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600"
                          onClick={() => openSecureFile(file.file_url, file.name)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {initialData?.videos?.map((vid, idx) => (
                      <div
                        key={`vid-${idx}`}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Video className="h-4 w-4 text-purple-500 shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {vid.name || vid.url}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600"
                          onClick={() =>
                            window.open(vid.url, "_blank", "noopener,noreferrer")
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {initialData?.links?.map((lnk, idx) => (
                      <div
                        key={`lnk-${idx}`}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <LinkIcon className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {lnk.name || lnk.url}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600"
                          onClick={() =>
                            window.open(lnk.url, "_blank", "noopener,noreferrer")
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t dark:border-white/20">
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("common.close", "Close")}
                </Button>
              </div>
            </div>
          ) : (
            /* ================= CREATE / EDIT FORM ================= */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Target Audience Select */}
              <div className="space-y-2">
                <Label>
                  {t("thesisManagement.qna.audienceLabel", "Target Audience")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "thesisManagement.qna.audiencePlaceholder",
                        "Select target audience"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before_purchase">
                      {t(
                        "thesisManagement.qna.beforePurchaseTitle",
                        "Eligible Students (Before & After Purchase)"
                      )}
                    </SelectItem>
                    <SelectItem value="after_purchase">
                      {t(
                        "thesisManagement.qna.afterPurchaseTitle",
                        "Enrolled Students Only (After Purchase)"
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {audience === "before_purchase"
                    ? t(
                        "thesisManagement.qna.beforePurchaseDesc",
                        "Visible to all eligible students on thesis catalogue and enrolled view."
                      )
                    : t(
                        "thesisManagement.qna.afterPurchaseDesc",
                        "Restricted strictly to students who purchased this trajectory cohort."
                      )}
                </p>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <Label>
                  {t("thesisManagement.qna.title", "Title")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t(
                    "thesisManagement.qna.titlePlaceholder",
                    "e.g. Master Thesis Orientation & Q&A Session"
                  )}
                />
              </div>

              {/* Scheduled Live Q&A Session Switch */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t(
                      "thesisManagement.qna.isScheduledSession",
                      "Schedule as Live Q&A Session"
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "thesisManagement.qna.isScheduledSessionDesc",
                      "Set a date, time, and meeting link for live session. Turn off for an announcement."
                    )}
                  </p>
                </div>
                <Switch
                  checked={isScheduled}
                  onCheckedChange={setIsScheduled}
                />
              </div>

              {/* Scheduled Date/Time & Video Meeting URL */}
              {isScheduled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50/30 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800">
                  <div className="space-y-2">
                    <Label>
                      {t("thesisManagement.qna.date", "Session Date")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t("thesisManagement.qna.time", "Time (Optional)")}
                    </Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-primary" />
                      {t(
                        "thesisManagement.qna.videoCallLink",
                        "Video Meeting Link"
                      )}
                    </Label>
                    <Input
                      type="url"
                      value={videoCallLink}
                      onChange={(e) => setVideoCallLink(e.target.value)}
                      placeholder="https://meet.google.com/... or https://zoom.us/..."
                    />
                  </div>
                </div>
              )}

              {/* Details & Description Rich Text */}
              <div className="space-y-2">
                <Label>
                  {t("thesisManagement.qna.message", "Details & Description")}
                </Label>
                <div className="border rounded-md overflow-hidden bg-background">
                  <RichTextEditor
                    value={message}
                    onChange={setMessage}
                    placeholder={t(
                      "thesisManagement.qna.messagePlaceholder",
                      "Write your announcement or session details..."
                    )}
                  />
                </div>
              </div>

              {/* Resources (Attachments, Videos, Links) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    {t("resourceModule.resources.title", "Resources")}
                  </Label>
                </div>

                <div className="space-y-2">
                  {/* Uploaded Files */}
                  {attachments.map((file, idx) => (
                    <div
                      key={`file-${idx}`}
                      className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                          <div className="flex-1 min-w-0 space-y-1">
                            <span
                              className="text-sm font-medium truncate block"
                              title={file.name}
                            >
                              {file.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {file.file_url && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-500 hover:text-blue-600"
                              onClick={() =>
                                openSecureFile(file.file_url, file.name)
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleRemoveAttachment(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-7">
                        <Input
                          value={file.name}
                          onChange={(e) =>
                            handleUpdateAttachmentName(idx, e.target.value)
                          }
                          placeholder={t(
                            "thesisManagement.qna.fileNamePlaceholder",
                            "File display name"
                          )}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Video Embeds */}
                  {videos.map((vid, idx) => (
                    <div
                      key={`vid-${idx}`}
                      className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Video className="h-4 w-4 text-purple-500 shrink-0" />
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              value={vid.name}
                              onChange={(e) =>
                                handleUpdateVideo(idx, "name", e.target.value)
                              }
                              placeholder={t(
                                "thesisManagement.qna.videoTitlePlaceholder",
                                "Video Title"
                              )}
                              className="h-8 text-xs"
                            />
                            <Input
                              value={vid.url}
                              onChange={(e) =>
                                handleUpdateVideo(idx, "url", e.target.value)
                              }
                              placeholder="https://youtube.com/..."
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {vid.url && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-500 hover:text-blue-600"
                              onClick={() =>
                                window.open(
                                  vid.url,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleRemoveVideo(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Links */}
                  {links.map((lnk, idx) => (
                    <div
                      key={`lnk-${idx}`}
                      className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <LinkIcon className="h-4 w-4 text-blue-500 shrink-0" />
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              value={lnk.name}
                              onChange={(e) =>
                                handleUpdateLink(idx, "name", e.target.value)
                              }
                              placeholder={t(
                                "thesisManagement.qna.linkLabelPlaceholder",
                                "Link Label"
                              )}
                              className="h-8 text-xs"
                            />
                            <Input
                              value={lnk.url}
                              onChange={(e) =>
                                handleUpdateLink(idx, "url", e.target.value)
                              }
                              placeholder="https://..."
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {lnk.url && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-500 hover:text-blue-600"
                              onClick={() =>
                                window.open(
                                  lnk.url,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleRemoveLink(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty state */}
                  {attachments.length === 0 &&
                    videos.length === 0 &&
                    links.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg border-gray-100 dark:border-gray-800">
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "resourceModule.resources.noResources",
                            "No resources added yet."
                          )}
                        </p>
                      </div>
                    )}
                </div>

                {/* Resource Actions (Upload File, Add Link, Add Video) */}
                <div className="flex items-center justify-end gap-2">
                  <div className="relative">
                    <input
                      type="file"
                      id="qna-file-upload-input"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() =>
                        document
                          .getElementById("qna-file-upload-input")
                          ?.click()
                      }
                      disabled={isUploadingAttachment}
                    >
                      {isUploadingAttachment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Cloud className="h-4 w-4" />
                      )}
                      {isUploadingAttachment
                        ? t("common.uploading", "Uploading...")
                        : t(
                            "resourceModule.resources.uploadFile",
                            "Upload File"
                          )}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={handleAddLink}
                  >
                    <Plus className="h-4 w-4" />
                    {t("resourceModule.resources.addLink", "Add Link")}
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={handleAddVideo}
                  >
                    <Plus className="h-4 w-4" />
                    {t("thesisManagement.qna.addVideo", "Add Video")}
                  </Button>
                </div>
              </div>

              {/* Form Actions Footer */}
              <FormActions
                onCancel={handleClose}
                isLoading={isPending || isUploadingAttachment}
                isEdit={isEditMode}
                submitText={
                  isUploadingAttachment
                    ? t("common.uploading", "Uploading...")
                    : undefined
                }
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
