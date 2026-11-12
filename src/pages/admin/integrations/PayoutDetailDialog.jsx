import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Download, PlusCircle, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { exportExactPayout } from "@/api/exactApi";
import { downloadCsv } from "@/utils/exportCsv";
import {
  useGetExactPayout,
  useQueueExactPayoutMissing,
  useSendExactPayoutWaiting,
} from "@/store/useExactStore";
import { LINE_STYLES, formatDate, money } from "./payoutUi";
import PayoutStateBadge from "./PayoutStateBadge";

//* Where a click on a line's status takes the admin (filtered on that record).
const STATUS_TARGET = {
  waiting: { tab: "to_send", view: "waiting" },
  sending: { tab: "to_send", view: "waiting" },
  failed: { tab: "to_send", view: "failed" },
  missing: { tab: "to_send", view: "missing" },
  in_exact: { tab: "history", view: "documents" },
  other_ref: { tab: "history", view: "documents" },
};

//* IPB-153: text a payout line can be found by — Mollie IDs, IAO record,
//* name/email, amount (150 / 150.00 / 150,00) and the Exact reference.
const lineSearchText = (l) => {
  const amount = l.amount === null || l.amount === undefined || l.amount === "" ? null : Number(l.amount);
  const amountText =
    amount === null || Number.isNaN(amount)
      ? []
      : [String(amount), amount.toFixed(2), amount.toFixed(2).replace(".", ",")];
  return [
    l.mollie_id,
    l.mollie_payment_id,
    l.record?.uid,
    l.payment_uid,
    l.name,
    l.description,
    l.email,
    ...amountText,
    l.your_ref,
    l.exact_entry_number,
  ]
    .filter((v) => v !== null && v !== undefined && v !== "")
    .join(" ")
    .toLowerCase();
};

/** One payout: every transaction with its Exact status, plus the batch actions.
 * onOpenRecord({ tab, view, search }): jump to To send / History filtered on a record. */
const PayoutDetailDialog = ({ settlementId, onClose, onOpenRecord, isConnected, canModify }) => {
  const { t } = useTranslation();
  const p = (key, opts) => t(`integrations.exact.payouts.${key}`, opts);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, error } = useGetExactPayout(settlementId);
  const { mutate: queueMissing, isPending: isQueueing } = useQueueExactPayoutMissing();
  const { mutate: sendWaiting, isPending: isSending } = useSendExactPayoutWaiting();

  const payout = data?.data?.payout;
  const lines = useMemo(() => data?.data?.lines ?? [], [data]);
  const counts = payout?.counts ?? {};
  const busy = isQueueing || isSending;

  //* IPB-153: search within the payout's payments (all lines are loaded, so filter client-side)
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch("");
  }, [settlementId]);
  const query = search.trim().toLowerCase();
  const visibleLines = useMemo(() => {
    if (!query) return lines;
    const terms = query.split(/\s+/);
    return lines.filter((l) => {
      const text = lineSearchText(l);
      return terms.every((term) => text.includes(term));
    });
  }, [lines, query]);

  const handleSendWaiting = () => {
    if (!window.confirm(p("confirmSendWaiting", { count: counts.waiting || 0, reference: payout?.reference }))) return;
    sendWaiting(settlementId);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      downloadCsv(await exportExactPayout(settlementId), `mollie_payout_${payout?.reference || settlementId}`);
    } catch (err) {
      toast.error(err?.message || p("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={Boolean(settlementId)} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[min(1400px,95vw)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {p("detailTitle")} {payout?.reference ? <span className="font-mono">{payout.reference}</span> : null}
          </DialogTitle>
          <DialogDescription>
            {payout
              ? p("detailSummary", {
                  date: formatDate(payout.settled_at || payout.created_at),
                  amount: money(payout.amount, payout.currency),
                  fees: money(payout.costs_gross, payout.currency),
                  payments: payout.payment_count,
                  refunds: payout.refund_count,
                })
              : null}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{p("loading")}</p>
        ) : error ? (
          <ErrorMessage message={error?.message || p("loadFailed")} variant="inline" />
        ) : payout ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <PayoutStateBadge state={payout.state} p={p} />
              <span className="text-sm text-muted-foreground">{p(`stateHint.${payout.state}`)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {canModify ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => queueMissing(settlementId)} disabled={!counts.missing || busy || !isConnected}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {p("queueMissing", { count: counts.missing || 0 })}
                  </Button>
                  <Button size="sm" onClick={handleSendWaiting} disabled={!counts.waiting || busy || !isConnected}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? p("sending") : p("sendWaiting", { count: counts.waiting || 0 })}
                  </Button>
                </>
              ) : null}
              <Button size="sm" variant="ghost" onClick={handleExport} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? p("exporting") : p("export")}
              </Button>
            </div>

            {/* IPB-153: search the payments of this payout */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 pr-9"
                  placeholder={p("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={p("searchPlaceholder")}
                />
                {search ? (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-900 dark:hover:text-white"
                    onClick={() => setSearch("")}
                    aria-label={p("clearSearch")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              {query ? (
                <span className="text-sm text-muted-foreground">
                  {p("searchCount", { shown: visibleLines.length, total: lines.length })}
                </span>
              ) : null}
            </div>

            <div className="border dark:border-white/10 rounded-lg overflow-x-auto">
              <Table className="w-full min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{p("col.mollie")}</TableHead>
                    <TableHead>{p("col.iao")}</TableHead>
                    <TableHead>{p("col.name")}</TableHead>
                    <TableHead className="text-right">{p("col.amount")}</TableHead>
                    <TableHead>{p("col.date")}</TableHead>
                    <TableHead>{p("col.exact")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query && visibleLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {p("noSearchResults", { search: search.trim() })}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {visibleLines.map((l) => (
                    <TableRow key={l.mollie_id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-mono text-xs">{l.mollie_id}</div>
                        <div className="text-xs text-muted-foreground">
                          {p(`lineType.${l.type}`)}
                          {l.method ? ` · ${l.method}` : ""}
                          {l.mollie_payment_id ? ` · ${l.mollie_payment_id}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-mono text-sm">{l.record?.uid || l.payment_uid || "—"}</div>
                        {l.record?.kind === "third_party_invoice" && l.payment_uid ? (
                          <div className="font-mono text-xs text-muted-foreground">{l.payment_uid}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="truncate" title={l.name || l.description || undefined}>
                          {l.name || l.description || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{l.email || ""}</div>
                      </TableCell>
                      <TableCell
                        className={`text-right whitespace-nowrap font-medium ${
                          Number(l.amount) < 0 ? "text-red-600 dark:text-red-400" : ""
                        }`}
                      >
                        {money(l.amount, l.currency)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(l.date)}</TableCell>
                      <TableCell className="min-w-[260px]">
                        {STATUS_TARGET[l.status] && l.record?.uid && onOpenRecord ? (
                          <button
                            type="button"
                            onClick={() => onOpenRecord({ ...STATUS_TARGET[l.status], search: l.record.uid })}
                            title={p(STATUS_TARGET[l.status].tab === "history" ? "openInHistory" : "openInToSend")}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium underline-offset-2 hover:underline ${
                              LINE_STYLES[l.status] || LINE_STYLES.unknown
                            }`}
                          >
                            {p(`line.${l.status}`)}
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              LINE_STYLES[l.status] || LINE_STYLES.unknown
                            }`}
                          >
                            {p(`line.${l.status}`)}
                          </span>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {l.exact_entry_number ? `#${l.exact_entry_number} · ` : ""}
                          {l.your_ref ? `${p("yourRef")}: ${l.your_ref}` : p(`lineHint.${l.status}`)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t("integrations.exact.toSend.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutDetailDialog;
