import { useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { StickyNote, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateStudentPersonalNote } from "@/store/useThesisStore";

export default function StudentPersonalNotesCard({
  thesisId,
  trajectoryId,
  userId,
  notes = [],
  canModify = true,
}) {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const createNoteMutation = useCreateStudentPersonalNote();

  const handleSaveNote = async () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    try {
      await createNoteMutation.mutateAsync({
        thesisId,
        trajectoryId,
        userId,
        note: trimmed,
      });
      setNoteText("");
      setIsAddOpen(false);
    } catch {
      // Error handled by store hook
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
        {/* Card Header */}
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

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <StickyNote className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">
              {t("thesisManagement.personalNotes.empty", "No personal notes added yet.")}
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
                ? `${creator.first_name?.[0] || ""}${creator.last_name?.[0] || ""}`.toUpperCase() || "S"
                : "S";

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
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs">
                    {item.note}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {t("thesisManagement.personalNotes.modalTitle", "Add Personal Note")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              {t(
                "thesisManagement.personalNotes.modalDesc",
                "This note will be visible to the student on their thesis details page."
              )}
            </p>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t(
                "thesisManagement.personalNotes.placeholder",
                "Type your personal note here..."
              )}
              rows={4}
              className="text-xs resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddOpen(false);
                setNoteText("");
              }}
              disabled={createNoteMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveNote}
              disabled={!noteText.trim() || createNoteMutation.isPending}
            >
              {createNoteMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {t("common.saving", "Saving...")}
                </>
              ) : (
                t("thesisManagement.personalNotes.saveNote", "Save Note")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
