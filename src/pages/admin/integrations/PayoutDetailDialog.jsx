import { useState } from "react";
import { Download, PlusCircle, Send } from "lucide-react";
import { toast } from "sonner";
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
import { exportExactPayout } from "@/api/exactApi";
import { downloadCsv } from "@/utils/exportCsv";
import {
  useGetExactPayout,
  useQueueExactPayoutMissing,
  useSendExactPayoutWaiting,
} from "@/store/useExactStore";
import { LINE_STYLES, formatDate, money } from "./payoutUi";
import PayoutStateBadge from "./PayoutStateBadge";

/** One payout: every transaction with its Exact status, plus the batch actions. */
const PayoutDetailDialog = ({ settlementId, onClose, isConnected, canModify }) => {
  const { t } = useTranslation();
  const p = (key, opts) => t(`integrations.exact.payouts.${key}`, opts);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, error } = useGetExactPayout(settlementId);
  const { mutate: queueMissing, isPending: isQueueing } = useQueueExactPayoutMissing();
  const { mutate: sendWaiting, isPending: isSending } = useSendExactPayoutWaiting();

  const payout = data?.data?.payout;
  const lines = data?.data?.lines ?? [];
  const counts = payout?.counts ?? {};
  const busy = isQueueing || isSending;

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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

            <div className="border dark:border-white/10 rounded-lg overflow-x-auto">
              <Table className="w-full min-w-[1000px]">
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
                  {lines.map((l) => (
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
                      <TableCell className="max-w-[300px]">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            LINE_STYLES[l.status] || LINE_STYLES.unknown
                          }`}
                        >
                          {p(`line.${l.status}`)}
                        </span>
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
