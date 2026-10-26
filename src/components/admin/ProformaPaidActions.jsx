import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatProformaPaidAt } from "@/utils/proformaCourseLabel";

const paidPillClass =
  "inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold leading-none text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300";

export function ProformaPaidBadge({ paidAt, paidByName }) {
  const when = formatProformaPaidAt(paidAt);
  const detail = [when, paidByName].filter(Boolean).join(" · ");
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span className={paidPillClass}>Paid</span>
      {detail ? (
        <span className="text-[11px] font-normal leading-none text-muted-foreground whitespace-nowrap">
          {detail}
        </span>
      ) : null}
    </span>
  );
}

export function ProformaPaidNote({ paidAt, paidByName }) {
  const when = formatProformaPaidAt(paidAt);
  if (!when && !paidByName) return null;
  const sentence = ["Paid", when ? `on ${when}` : null, paidByName ? `by ${paidByName}` : null]
    .filter(Boolean)
    .join(" ");
  return <p className="mt-1 text-xs text-muted-foreground">{sentence}</p>;
}

export function MarkProformaPaidDialog({
  invoice,
  open,
  onOpenChange,
  onConfirm,
  pending = false,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as paid</DialogTitle>
          <DialogDescription>
            Mark expense note {invoice?.proforma_number || ""} as paid? This records today's date
            and your name.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={pending || !invoice}>
            {pending ? "Marking..." : "Mark as paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
