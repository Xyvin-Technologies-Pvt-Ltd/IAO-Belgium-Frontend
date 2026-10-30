import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, RefreshCw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import {
  useGetExactToSend,
  useGetExactToSendPreview,
  useSendExactJob,
} from "@/store/useExactStore";

const STATE_STYLES = {
  held: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  sending: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function money(value, currency) {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(2)} ${currency || ""}`.trim();
}

function Field({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b last:border-b-0 dark:border-white/10">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right break-all">{children}</span>
    </div>
  );
}

function PreviewBody({ preview, t }) {
  const { plan, ok, skip, errors = [], warnings = [] } = preview;
  const k = (key, opts) => t(`integrations.exact.toSend.${key}`, opts);

  return (
    <div className="space-y-4 text-sm">
      {skip ? (
        <div className="rounded-md border border-gray-200 dark:border-white/10 bg-muted/50 px-3 py-2">
          {k("skipped", { message: skip.message || skip.reason })}
        </div>
      ) : ok ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {k("ready")}
        </div>
      ) : (
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-red-800 dark:text-red-300">
          <div className="flex items-center gap-2 font-medium">
            <XCircle className="h-4 w-4" />
            {k("blocked")}
          </div>
          <ul className="list-disc ml-6 mt-1 space-y-0.5">
            {errors.map((e, i) => (
              <li key={`${e.field}-${i}`}>
                <span className="font-mono text-xs">{e.field}</span>: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length ? (
        <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {k("warnings")}
          </div>
          <ul className="list-disc ml-6 mt-1 space-y-0.5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan && !skip ? (
        <>
          <div>
            <div className="font-medium mb-1">{k("header")}</div>
            <div className="rounded-md border dark:border-white/10 px-3 py-1">
              <Field label={k("record")}>
                {plan.kind_label} · <span className="font-mono">{plan.record?.uid}</span>
              </Field>
              <Field label={k("customer")}>
                {plan.customer?.kind === "company" ? k("customerCompany") : k("customerStudent")}:{" "}
                {plan.customer?.name || "—"}
                {plan.customer?.email ? ` (${plan.customer.email})` : ""}
                {plan.customer?.in_exact === true ? ` · ${k("inExact")}` : ""}
                {plan.customer?.in_exact === false ? ` · ${k("newInExact")}` : ""}
              </Field>
              <Field label={k("journal")}>{plan.journal}</Field>
              <Field label={k("entryDate")}>
                {plan.entry_date || "—"}
                {plan.entry_date_source ? (
                  <span className="text-muted-foreground"> ({plan.entry_date_source})</span>
                ) : null}
              </Field>
              <Field label={k("entryType")}>
                {plan.type === 21 ? k("typeCredit") : k("typeSale")}
              </Field>
              <Field label={k("description")}>{plan.description || "—"}</Field>
              <Field label={k("yourRef")}>
                <span className="font-mono">{plan.your_ref || "—"}</span>
                {plan.your_ref_source ? (
                  <span className="text-muted-foreground"> ({plan.your_ref_source})</span>
                ) : null}
              </Field>
              <Field label={k("currency")}>{plan.currency}</Field>
              <Field label={k("pdf")}>{plan.pdf?.filename || "—"}</Field>
              <Field label={k("totals")}>
                {plan.totals
                  ? `${money(plan.totals.net)} / ${money(plan.totals.vat)} / ${money(plan.totals.gross)}`
                  : "—"}
              </Field>
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">{k("lines")}</div>
            <div className="rounded-md border dark:border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{k("lineDescription")}</TableHead>
                    <TableHead className="text-right">{k("lineAmount")}</TableHead>
                    <TableHead>{k("lineGl")}</TableHead>
                    <TableHead>{k("lineVat")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(plan.lines || []).map((line, i) => (
                    <TableRow key={`${line.gl_code}-${i}`}>
                      <TableCell>{line.description || "—"}</TableCell>
                      <TableCell
                        className={`text-right whitespace-nowrap ${
                          Number(line.amount) < 0 ? "text-red-600 dark:text-red-400" : ""
                        }`}
                      >
                        {money(line.amount, plan.currency)}
                      </TableCell>
                      <TableCell className="font-mono">{line.gl_code || "—"}</TableCell>
                      <TableCell className="font-mono">{line.vat_code || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

const ToSendTab = ({ isConnected, canModify, mode }) => {
  const { t } = useTranslation();
  const k = (key, opts) => t(`integrations.exact.toSend.${key}`, opts);
  const [previewJob, setPreviewJob] = useState(null);

  const { data, isLoading, isFetching, error, refetch } = useGetExactToSend();
  const {
    data: previewResponse,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useGetExactToSendPreview(previewJob?.job_id);
  const { mutate: sendJob, isPending: isSending, variables: sendingJobId } = useSendExactJob();

  const rows = data?.data ?? [];
  const counts = data?.counts ?? {};
  const waiting = (counts.held || 0) + (counts.failed || 0);
  const preview = previewResponse?.data;

  const handleSend = (row) => {
    sendJob(row.job_id, {
      onSuccess: () => {
        toast.success(`${row.record_uid || row.job_id}: ${k("sent")}`);
        setPreviewJob(null);
      },
    });
  };

  const actionLabel = (row) => (row.state === "failed" ? k("retry") : k("send"));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex-1 ${
            mode === "auto"
              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
          }`}
        >
          {mode === "auto" ? k("bannerAuto") : k("banner", { count: waiting })}
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          {k("refresh")}
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} columns={7} />
      ) : error ? (
        <ErrorMessage message={error?.message || k("loadFailed")} onRetry={refetch} variant="inline" />
      ) : rows.length === 0 ? (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {k("empty")}
        </div>
      ) : (
        <div className="border dark:border-white/10 rounded-lg overflow-x-auto">
          <Table className="w-full min-w-[1000px]">
            <TableHeader>
              <TableRow>
                <TableHead>{k("type")}</TableHead>
                <TableHead>{k("record")}</TableHead>
                <TableHead>{k("name")}</TableHead>
                <TableHead className="text-right">{t("integrations.exact.table.amount")}</TableHead>
                <TableHead>{k("date")}</TableHead>
                <TableHead>{k("status")}</TableHead>
                <TableHead className="text-right">{t("integrations.exact.table.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isNegative = Number(row.amount) < 0;
                const canSend = canModify && isConnected && row.state !== "sending";
                return (
                  <TableRow key={row.job_id}>
                    <TableCell className="whitespace-nowrap">{row.kind_label || row.job_name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-mono text-sm">{row.record_uid || "—"}</div>
                      {row.invoice_uid && row.invoice_uid !== row.record_uid ? (
                        <div className="font-mono text-xs text-muted-foreground">{row.invoice_uid}</div>
                      ) : null}
                      {row.summary_error ? (
                        <div className="text-xs text-red-600 dark:text-red-400">{row.summary_error}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="truncate" title={row.name || undefined}>{row.name || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate" title={row.email || undefined}>
                        {row.email || "—"}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right whitespace-nowrap font-medium ${
                        isNegative ? "text-red-600 dark:text-red-400" : ""
                      }`}
                    >
                      {money(row.amount, row.currency)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>{formatDate(row.date)}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(row.queued_at)}</div>
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATE_STYLES[row.state] || STATE_STYLES.held
                        }`}
                      >
                        {k(`state.${row.state}`)}
                      </span>
                      {row.failed_reason ? (
                        <div className="text-xs text-red-700 dark:text-red-300 mt-1 break-words">
                          {row.failed_reason}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {/* Send / Retry live in the preview, so every record is
                          looked at before it goes to Exact. */}
                      <Button
                        variant={canSend && row.state !== "sending" ? "outline" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewJob(row)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        {isSending && sendingJobId === row.job_id ? k("sendingNow") : k("preview")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(previewJob)} onOpenChange={(open) => !open && !isSending && setPreviewJob(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{k("previewTitle")}</DialogTitle>
            <DialogDescription>
              {previewJob ? `${previewJob.kind_label || previewJob.job_name} · ${previewJob.record_uid || previewJob.job_id}` : null}
            </DialogDescription>
          </DialogHeader>

          {isPreviewLoading ? (
            <p className="text-sm text-muted-foreground">{k("previewLoading")}</p>
          ) : previewError ? (
            <ErrorMessage message={previewError?.message || k("previewFailed")} variant="inline" />
          ) : preview ? (
            <PreviewBody preview={preview} t={t} />
          ) : null}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setPreviewJob(null)} disabled={isSending}>
              {k("close")}
            </Button>
            {canModify && previewJob ? (
              <Button
                onClick={() => handleSend(previewJob)}
                disabled={
                  isSending ||
                  !isConnected ||
                  previewJob.state === "sending" ||
                  !preview?.ok
                }
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? k("sendingNow") : actionLabel(previewJob)}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToSendTab;
