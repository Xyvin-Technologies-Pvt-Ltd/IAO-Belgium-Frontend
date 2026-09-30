import React from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Section conversation — matches LMS card/thread patterns used elsewhere.
 */
export default function ProformaSectionNotes({
  comments = [],
  value = "",
  onChange,
  onSend,
  disabled = false,
  pending = false,
  myRole = "TEACHER",
  placeholder = "Write a note about this section…",
}) {
  const isMine = (c) =>
    myRole === "TEACHER"
      ? c.sender_role === "TEACHER"
      : c.sender_role === "BACKOFFICE" || c.sender_role === "ADMIN";

  return (
    <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-3">
      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
        Notes
        {comments.length > 0 && (
          <span className="text-muted-foreground font-normal">({comments.length})</span>
        )}
      </p>

      {comments.length > 0 ? (
        <div className="space-y-2.5 max-h-52 overflow-y-auto rounded-xl border border-border bg-card p-3">
          {comments.map((c, idx) => {
            const mine = isMine(c);
            return (
              <div key={idx} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1 px-1">
                  <span className="font-semibold text-foreground">
                    {mine ? "You" : c.sender_name || (c.sender_role === "TEACHER" ? "Teacher" : "Admin")}
                  </span>
                  <span>·</span>
                  <span className="font-mono">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] text-xs px-3.5 py-2 shadow-sm ${
                    mine
                      ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none"
                      : "bg-muted text-foreground border border-border rounded-2xl rounded-tl-none"
                  }`}
                >
                  {c.comment}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No notes yet. Start the conversation.</p>
      )}

      {!disabled && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value?.trim()) onSend?.();
            }}
            className="text-xs h-9 font-medium bg-card border-border"
          />
          <Button
            size="sm"
            disabled={!value?.trim() || pending}
            onClick={onSend}
            className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
