import React, { useState } from "react";
import { MessageSquare, Plus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Compact section notes: show thread only when notes exist;
 * otherwise a single "Add note" button until composing.
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
  const [composing, setComposing] = useState(false);
  const hasNotes = comments.length > 0;
  const isAdmin = myRole === "ADMIN" || myRole === "BACKOFFICE";
  const isMine = (c) =>
    myRole === "TEACHER"
      ? c.sender_role === "TEACHER"
      : c.sender_role === "BACKOFFICE" || c.sender_role === "ADMIN";

  const openComposer = () => setComposing(true);
  const closeComposer = () => {
    setComposing(false);
    onChange?.("");
  };

  const handleSend = () => {
    if (!value?.trim()) return;
    onSend?.();
    setComposing(false);
  };

  // No notes yet: only an Add note button (or nothing if disabled)
  if (!hasNotes && !composing) {
    if (disabled) return null;
    return (
      <div className="border-t border-border px-5 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openComposer}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add note
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-3">
      {hasNotes && (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              Notes
              <span className="text-muted-foreground font-normal">({comments.length})</span>
            </p>
            {!disabled && !composing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={openComposer}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add note
              </Button>
            )}
          </div>

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
        </>
      )}

      {!disabled && composing && (
        <div className="space-y-2">
          {!hasNotes && (
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              Add note
            </p>
          )}
          {isAdmin && (
            <p className="text-[11px] text-muted-foreground">
              Sending a note clears Confirm on this section and asks the teacher to revise.
            </p>
          )}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              autoFocus
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && value?.trim()) handleSend();
                if (e.key === "Escape") closeComposer();
              }}
              className="text-xs h-9 font-medium bg-card border-border"
            />
            <Button
              size="sm"
              disabled={!value?.trim() || pending}
              onClick={handleSend}
              className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={closeComposer}
              className="h-9 w-9 p-0 shrink-0 text-muted-foreground"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
