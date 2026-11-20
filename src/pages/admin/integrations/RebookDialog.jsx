import { CheckCircle2, ReceiptText, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useGetExactRebookPreview, usePostExactRebook } from "@/store/useExactStore";
import { formatDate, money } from "./auditUi";

function Field({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b last:border-b-0 dark:border-white/10">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right break-all">{children}</span>
    </div>
  );
}

/**
 * Re-book on correct GL: old entry → credit (original date, CR-<entry>) → new entry
 * (correct GL, original date, same Your ref., IAO PDF). Nothing is posted until
 * "Re-book in Exact".
 */
const RebookDialog = ({ entryNumber, onClose, canModify }) => {
  const { t } = useTranslation();
  const r = (key, opts) => t(`integrations.exact.audit.rebook.${key}`, opts);
  const { data, isLoading, error } = useGetExactRebookPreview(entryNumber);
  const { mutate: rebook, isPending } = usePostExactRebook();
  const p = data?.data;

  const handle = () => {
    if (!window.confirm(r("confirm", { number: entryNumber }))) return;
    rebook(entryNumber, { onSuccess: () => onClose() });
  };

  return (
    <Dialog open={Boolean(entryNumber)} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{r("title", { number: entryNumber })}</DialogTitle>
          <DialogDescription>{r("intro")}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{r("loading")}</p>
        ) : error ? (
          <ErrorMessage message={error?.message || r("loadFailed")} variant="inline" />
        ) : p ? (
          <div className="space-y-4 text-sm">
            {p.progress?.new_entry_number ? (
              <div className="flex gap-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-blue-800 dark:text-blue-200">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                {r("done", { credit: p.progress.credit_entry_number ?? "?", entry: p.progress.new_entry_number })}
              </div>
            ) : p.ok ? (
              <div className="flex gap-2 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                {r("ready")}
              </div>
            ) : (
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-red-800 dark:text-red-300">
                <div className="flex items-center gap-2 font-medium">
                  <XCircle className="h-4 w-4" />
                  {r("blocked")}
                </div>
                <ul className="list-disc ml-6 mt-1">
                  {p.problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="font-medium mb-1">{r("old")}</div>
                <div className="rounded-md border dark:border-white/10 px-3 py-1">
                  <Field label={r("entry")}>#{p.old.entry_number}</Field>
                  <Field label={r("date")}>{formatDate(p.old.entry_date)}</Field>
                  <Field label={r("yourRef")}>{p.old.your_ref || "—"}</Field>
                  <Field label={r("customer")}>{p.old.customer_name || "—"}</Field>
                  <Field label={r("gl")}>
                    <span className="font-mono text-red-700 dark:text-red-300">{p.old.gl_codes.join(", ") || "—"}</span>
                  </Field>
                  <Field label={r("amount")}>{money(p.old.amount)}</Field>
                  <Field label={r("iao")}>{p.iao?.uid || "—"}</Field>
                </div>
              </div>
              <div>
                <div className="font-medium mb-1 flex items-center gap-1.5">
                  <ReceiptText className="h-4 w-4" />
                  {r("credit")}
                </div>
                <div className="rounded-md border dark:border-white/10 px-3 py-1">
                  <Field label={r("yourRef")}>
                    <span className="font-mono">{p.credit.your_ref}</span>
                  </Field>
                  <Field label={r("date")}>{formatDate(p.credit.entry_date)}</Field>
                  <Field label={r("description")}>{p.credit.description}</Field>
                  <Field label={r("amount")}>{money(p.credit.total)}</Field>
                  {p.credit.already_in_exact?.entry_number ? (
                    <Field label={r("status")}>{r("creditExists", { number: p.credit.already_in_exact.entry_number })}</Field>
                  ) : null}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">{r("newEntry")}</div>
                {p.new_entry ? (
                  <div className="rounded-md border dark:border-white/10 px-3 py-1">
                    <Field label={r("date")}>{formatDate(p.new_entry.entry_date)}</Field>
                    <Field label={r("yourRef")}>
                      <span className="font-mono">{p.new_entry.your_ref || "—"}</span>
                    </Field>
                    <Field label={r("description")}>{p.new_entry.description}</Field>
                    <Field label={r("gl")}>
                      <span className="font-mono text-emerald-700 dark:text-emerald-300">
                        {[...new Set(p.new_entry.lines.map((l) => l.gl_code || "—"))].join(", ")}
                      </span>
                    </Field>
                    <Field label={r("amount")}>{money(p.new_entry.total)}</Field>
                    <Field label={r("customer")}>{p.new_entry.customer || "—"}</Field>
                    <Field label={r("pdf")}>{p.new_entry.pdf || "—"}</Field>
                  </div>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
            </div>

            <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-amber-800 dark:text-amber-200">
              {r("after")}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {r("close")}
          </Button>
          {canModify && p?.ok ? (
            <Button onClick={handle} disabled={isPending}>
              <ReceiptText className="h-4 w-4 mr-2" />
              {isPending ? r("posting") : r("post")}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RebookDialog;
