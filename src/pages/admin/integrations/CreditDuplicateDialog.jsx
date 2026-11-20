import { useState } from "react";
import { AlertTriangle, CheckCircle2, ReceiptText, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useGetExactCreditPreview, usePostExactCredit } from "@/store/useExactStore";
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
 * Audit → Duplicate → Credit. The preview reads the duplicate live from Exact and
 * shows the mirroring credit; nothing is posted until "Post credit in Exact".
 */
const CreditDuplicateDialog = ({ entryNumber, onClose, canModify }) => {
  const { t } = useTranslation();
  const c = (key, opts) => t(`integrations.exact.audit.credit.${key}`, opts);
  const [dateMode, setDateMode] = useState("today");
  const { data, isLoading, error } = useGetExactCreditPreview(entryNumber, dateMode);
  const { mutate: postCredit, isPending } = usePostExactCredit();
  const p = data?.data;

  const handlePost = () => {
    if (!window.confirm(c("confirm", { number: entryNumber, amount: money(Math.abs(p?.credit?.total ?? 0)) }))) return;
    postCredit({ entryNumber, dateMode }, { onSuccess: () => onClose() });
  };

  return (
    <Dialog open={Boolean(entryNumber)} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{c("title", { number: entryNumber })}</DialogTitle>
          <DialogDescription>{c("intro")}</DialogDescription>
        </DialogHeader>

        <div className="inline-flex rounded-lg border dark:border-white/10 p-0.5 text-sm self-start" role="tablist">
          {["today", "original"].map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={dateMode === mode}
              onClick={() => setDateMode(mode)}
              className={`rounded-md px-3 py-1 font-medium ${dateMode === mode ? "bg-blue-600 text-white" : "text-muted-foreground"}`}
            >
              {c(`date.${mode}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{c("loading")}</p>
        ) : error ? (
          <ErrorMessage message={error?.message || c("loadFailed")} variant="inline" />
        ) : p ? (
          <div className="space-y-4 text-sm">
            {p.already_in_exact ? (
              <div className="flex gap-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-blue-800 dark:text-blue-200">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                {c("alreadyInExact", { number: p.already_in_exact.entry_number ?? "?" })}
              </div>
            ) : p.ok ? (
              <div className="flex gap-2 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                {c("ready")}
              </div>
            ) : (
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-red-800 dark:text-red-300">
                <div className="flex items-center gap-2 font-medium">
                  <XCircle className="h-4 w-4" />
                  {c("blocked")}
                </div>
                <ul className="list-disc ml-6 mt-1">
                  {p.problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="font-medium mb-1">{c("duplicate")}</div>
                <div className="rounded-md border dark:border-white/10 px-3 py-1">
                  <Field label={c("entry")}>#{p.duplicate.entry_number}</Field>
                  <Field label={c("entryDate")}>{formatDate(p.duplicate.entry_date)}</Field>
                  <Field label={c("yourRef")}>{p.duplicate.your_ref || "—"}</Field>
                  <Field label={c("customer")}>{p.duplicate.customer_name || "—"}</Field>
                  <Field label={c("amount")}>{money(p.duplicate.amount)}</Field>
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">{c("iaoRecord")}</div>
                <div className="rounded-md border dark:border-white/10 px-3 py-1">
                  <Field label={c("record")}>{p.iao?.uid || "—"}</Field>
                  <Field label={c("payment")}>{p.iao?.payment_uid || "—"}</Field>
                  <Field label={c("why")}>{p.detail || "—"}</Field>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 font-medium mb-1">
                <ReceiptText className="h-4 w-4" />
                {c("creditTitle")}
              </div>
              <div className="rounded-md border dark:border-white/10 px-3 py-1 mb-2">
                <Field label={c("yourRef")}>
                  <span className="font-mono">{p.credit.your_ref}</span>
                </Field>
                <Field label={c("entryDate")}>{formatDate(p.credit.entry_date)}</Field>
                <Field label={c("description")}>{p.credit.description}</Field>
                <Field label={c("total")}>{money(p.credit.total)}</Field>
              </div>
              <div className="rounded-md border dark:border-white/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{c("description")}</TableHead>
                      <TableHead className="text-right">{c("amount")}</TableHead>
                      <TableHead>{c("vat")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.credit.lines.map((line, i) => (
                      <TableRow key={`${line.gl_account}-${i}`}>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right text-red-600 dark:text-red-400">{money(line.amount)}</TableCell>
                        <TableCell className="font-mono">{line.vat_code || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {c("after")}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t("integrations.exact.toSend.close")}
          </Button>
          {canModify && p ? (
            <Button onClick={handlePost} disabled={isPending || (!p.ok && !p.already_in_exact)}>
              <ReceiptText className="h-4 w-4 mr-2" />
              {isPending ? c("posting") : p.already_in_exact ? c("recordExisting") : c("post")}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditDuplicateDialog;
