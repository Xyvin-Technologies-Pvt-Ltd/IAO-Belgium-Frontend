import React, { useState } from "react";
import { ChevronDown, Paperclip, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MultiFileSectionUploader from "@/components/common/MultiFileSectionUploader";

export default function ProformaEvidenceNotes({
  sectionKey,
  sectionTitle,
  docs = [],
  comments = [],
  onUploadSuccess,
  uploadDisabled = false,
  replyValue = "",
  onReplyChange,
  onSendReply,
  replyDisabled = false,
  replyPending = false,
  isTeacherView = false,
}) {
  const [open, setOpen] = useState(false);
  const count = docs.length + comments.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border/60">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition"
        >
          <span className="flex items-center gap-2">
            <Paperclip className="w-3.5 h-3.5" />
            Evidence &amp; notes
            {count > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-semibold text-foreground">{count}</span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-5 pb-4 space-y-4 bg-muted/20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Receipts ({sectionTitle})
            </p>
            <MultiFileSectionUploader
              sectionKey={sectionKey}
              existingAttachments={docs}
              onUploadSuccess={onUploadSuccess}
              disabled={uploadDisabled}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Notes ({comments.length})
            </p>
            {comments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-border/60 bg-background p-2.5">
                {comments.map((c, idx) => {
                  const mine = isTeacherView ? c.sender_role === "TEACHER" : c.sender_role !== "TEACHER";
                  return (
                    <div key={idx} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                      <div className="text-[10px] text-muted-foreground mb-0.5 px-1">
                        <span className="font-semibold text-foreground">{c.sender_name}</span>
                        <span> · {new Date(c.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div
                        className={`max-w-[90%] text-xs px-3 py-1.5 rounded-xl ${
                          mine ? "bg-foreground text-background rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                        }`}
                      >
                        {c.comment}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No notes yet.</p>
            )}
            {!replyDisabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Add a note…"
                  value={replyValue}
                  onChange={(e) => onReplyChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && replyValue?.trim()) onSendReply?.();
                  }}
                  className="text-xs h-8"
                />
                <Button
                  size="sm"
                  disabled={!replyValue?.trim() || replyPending}
                  onClick={onSendReply}
                  className="h-8 px-3 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
