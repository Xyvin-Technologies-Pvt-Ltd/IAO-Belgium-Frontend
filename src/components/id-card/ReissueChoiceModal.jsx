import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import {
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";

/**
 * ReissueChoiceModal
 * Presents an interactive choice between keeping the existing cardholder photo
 * or uploading and cropping a new photo for an ID card reissue.
 */
const ReissueChoiceModal = ({
  open,
  onClose,
  onKeepSame,
  onUploadNew,
  loading = false,
  card = null,
}) => {
  const [submittingKeep, setSubmittingKeep] = useState(false);

  const handleKeepSameClick = async () => {
    if (loading || submittingKeep) return;
    try {
      setSubmittingKeep(true);
      await onKeepSame?.();
    } finally {
      setSubmittingKeep(false);
    }
  };

  const isBusy = loading || submittingKeep;

  const cardholderName =
    card?.teacher_name ||
    card?.student_name ||
    [card?.teacher_first_name, card?.teacher_last_name]
      .filter(Boolean)
      .join(" ") ||
    [card?.student_first_name, card?.student_last_name]
      .filter(Boolean)
      .join(" ") ||
    null;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && !isBusy) {
          onClose?.();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="gap-2 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ff8904] dark:bg-orange-950/40 dark:text-orange-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-dashboard-text dark:text-white">
                Reissue ID card
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Choose how to handle the photo for this reissued card
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {card && cardholderName ? (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-3 text-xs">
            <div className="h-10 w-8 overflow-hidden rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 shrink-0">
              {card.photo_url ? (
                <img
                  src={card.photo_url}
                  alt={cardholderName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground font-semibold">
                  ID
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-dashboard-text dark:text-white truncate text-sm">
                {cardholderName}
              </p>
            </div>
            {card.status ? (
              <div className="shrink-0">
                <StatusBadge status={card.status} />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 pt-1">
          {/* Option 1: Keep current photo */}
          <button
            type="button"
            disabled={isBusy}
            onClick={handleKeepSameClick}
            className="group relative flex items-start gap-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 p-4 text-left transition-all hover:border-[#ff8904] hover:bg-orange-50/40 dark:hover:border-[#ff8904]/70 dark:hover:bg-orange-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8904] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200 group-hover:bg-orange-100 group-hover:text-[#ff8904] dark:group-hover:bg-orange-950/40 transition-colors">
              {submittingKeep ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#ff8904]" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-dashboard-text dark:text-white group-hover:text-[#ff8904] transition-colors">
                Keep same photo
              </span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Reissue immediately using the current photograph already on file.
              </p>
            </div>
            <div className="self-center pl-1 text-gray-400 group-hover:text-[#ff8904] group-hover:translate-x-0.5 transition-all">
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

          {/* Option 2: Upload new photo */}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              if (isBusy) return;
              onUploadNew?.();
            }}
            className="group relative flex items-start gap-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 p-4 text-left transition-all hover:border-[#ff8904] hover:bg-orange-50/40 dark:hover:border-[#ff8904]/70 dark:hover:bg-orange-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8904] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[#ff8904] dark:bg-orange-950/40 dark:text-orange-400 group-hover:bg-[#ff8904] group-hover:text-white transition-colors">
              <Upload className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-dashboard-text dark:text-white group-hover:text-[#ff8904] transition-colors">
                Upload new photo
              </span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Choose and frame a new portrait photograph before issuing the card.
              </p>
            </div>
            <div className="self-center pl-1 text-gray-400 group-hover:text-[#ff8904] group-hover:translate-x-0.5 transition-all">
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>

        <DialogFooter className="mt-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isBusy}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReissueChoiceModal;
