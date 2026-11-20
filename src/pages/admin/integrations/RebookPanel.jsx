import { useState } from "react";
import { ChevronDown, ChevronUp, ReceiptText, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useFindExactRebook, usePostExactRebookMany } from "@/store/useExactStore";
import RebookDialog from "./RebookDialog";
import { formatDate, money } from "./auditUi";

/**
 * Audit → "Re-book on correct GL": entries booked on a wrong GL account (e.g. 700024
 * Test) are credited on their original date and booked again on the correct GL.
 */
const RebookPanel = ({ canModify, isConnected }) => {
  const { t } = useTranslation();
  const r = (key, opts) => t(`integrations.exact.audit.rebook.${key}`, opts);
  const [open, setOpen] = useState(false);
  const [gl, setGl] = useState("700024");
  const [search, setSearch] = useState(null);
  const [previewEntry, setPreviewEntry] = useState(null);
  const { data, isFetching, error, refetch } = useFindExactRebook(search);
  const { mutate: rebookMany, isPending: isBatch } = usePostExactRebookMany();
  const entries = data?.data?.entries ?? [];
  const pending = entries.filter((e) => !e.rebook?.new_entry_number && e.type !== 21);

  const handleFind = () => {
    if (search === gl) refetch();
    else setSearch(gl);
  };

  const handleAll = () => {
    const ids = pending.slice(0, 50).map((e) => e.entry_number);
    if (!ids.length || !window.confirm(r("confirmAll", { count: ids.length, gl: search }))) return;
    rebookMany(ids);
  };

  return (
    <div className="rounded-lg border dark:border-white/10">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 font-medium">
          <ReceiptText className="h-4 w-4" />
          {r("panelTitle")}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open ? (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-muted-foreground">{r("panelIntro")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input value={gl} onChange={(e) => setGl(e.target.value.trim())} className="w-40 font-mono" placeholder="700024" />
            <Button size="sm" variant="outline" onClick={handleFind} disabled={!/^\d{3,10}$/.test(gl) || !isConnected || isFetching}>
              <Search className="h-4 w-4 mr-2" />
              {isFetching ? r("finding") : r("find")}
            </Button>
            {canModify && pending.length ? (
              <Button size="sm" onClick={handleAll} disabled={isBatch || !isConnected}>
                <ReceiptText className="h-4 w-4 mr-2" />
                {isBatch ? r("posting") : r("rebookAll", { count: Math.min(pending.length, 50) })}
              </Button>
            ) : null}
          </div>

          {error ? (
            <ErrorMessage message={error?.message || r("loadFailed")} variant="inline" />
          ) : search && !isFetching ? (
            entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">{r("none", { gl: search })}</p>
            ) : (
              <div className="border dark:border-white/10 rounded-lg overflow-x-auto">
                <Table className="w-full min-w-[960px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{r("entry")}</TableHead>
                      <TableHead>{r("date")}</TableHead>
                      <TableHead>{r("customer")}</TableHead>
                      <TableHead>{r("iao")}</TableHead>
                      <TableHead className="text-right">{r("amount")}</TableHead>
                      <TableHead>{r("status")}</TableHead>
                      <TableHead className="text-right">{t("integrations.exact.table.action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => (
                      <TableRow key={e.entry_number}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-mono text-sm">#{e.entry_number}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">{e.your_ref || "—"}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(e.entry_date)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{e.customer_name || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{e.iao?.uid || r("noIao")}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{money(e.amount_on_gl)}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {e.rebook?.new_entry_number
                            ? r("stateDone", { credit: e.rebook.credit_entry_number ?? "?", entry: e.rebook.new_entry_number })
                            : e.rebook?.state === "posting"
                              ? r("statePosting")
                              : e.rebook?.state === "credited"
                                ? r("stateCredited", { credit: e.rebook.credit_entry_number ?? "?" })
                                : e.type === 21
                                  ? r("stateCreditEntry")
                                  : r("stateTodo")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setPreviewEntry(e.entry_number)}>
                            {r("preview")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : null}
          {data?.data?.not_in_copy ? <p className="text-xs text-muted-foreground">{r("notInCopy", { count: data.data.not_in_copy })}</p> : null}
        </div>
      ) : null}
      <RebookDialog entryNumber={previewEntry} onClose={() => setPreviewEntry(null)} canModify={canModify} />
    </div>
  );
};

export default RebookPanel;
