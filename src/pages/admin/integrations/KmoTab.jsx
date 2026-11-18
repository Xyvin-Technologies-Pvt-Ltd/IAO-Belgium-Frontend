import { useState } from "react";
import { Download, Info, ListPlus } from "lucide-react";
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
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { exportExactKmo, getExactKmo } from "@/api/exactApi";
import { downloadCsv } from "@/utils/exportCsv";
import { useAddExactToOutbox, useAddExactToOutboxMany, useGetExactKmo } from "@/store/useExactStore";

const STATE_STYLES = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  old_format: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  no_reference: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  not_in_exact_copy: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  waiting: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  sending: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  missing: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  not_needed: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
};
const CREDIT_STYLES = {
  in_exact: "text-muted-foreground",
  waiting: "text-amber-700 dark:text-amber-300",
  sending: "text-blue-700 dark:text-blue-300",
  failed: "text-red-700 dark:text-red-300",
  missing: "text-red-700 dark:text-red-300",
  not_needed: "text-muted-foreground",
};
const KMO_STATUSES = ["waiting", "submitted", "contribution_received", "payment_released", "paid", "rejected"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

/**
 * KMOP: every KMO(P) invoice and where it stands in Exact. KMO invoices have no
 * Mollie payment, so in Exact Your ref. = invoice number and the description
 * names the module. Sending happens through To send (Missing → Waiting).
 */
const KmoTab = ({ canModify, isConnected, page, setPage, rowsPerPage, setRowsPerPage, filters = {}, filtersActive }) => {
  const { t } = useTranslation();
  const k = (key, opts) => t(`integrations.exact.kmo.${key}`, opts);
  const [state, setState] = useState(null);
  const [kmoStatus, setKmoStatus] = useState("");
  const [creditMissing, setCreditMissing] = useState(false);
  const [busy, setBusy] = useState(false);

  const query = {
    ...filters,
    ...(state ? { state } : {}),
    ...(kmoStatus ? { kmo_status: kmoStatus } : {}),
    ...(creditMissing ? { credit_missing: 1 } : {}),
  };
  const { data, isLoading, error, refetch } = useGetExactKmo({ ...query, page, limit: rowsPerPage });
  const { mutateAsync: addMany } = useAddExactToOutboxMany();
  const { mutate: addOne, isPending: addingOne, variables: addingVars } = useAddExactToOutbox();

  const rows = data?.data ?? [];
  const total = data?.total_count ?? 0;
  const summary = data?.summary ?? {};
  const counts = summary.counts ?? {};
  const creditCounts = summary.credit_counts ?? {};

  const pick = (value) => {
    setState((current) => (current === value ? null : value));
    setCreditMissing(false);
    setPage(1);
  };

  //* Missing KMO invoices (matching the filters) → To send, in batches. Nothing is sent yet.
  const handleAddMissing = async () => {
    setBusy(true);
    try {
      const ids = [];
      for (let p = 1; p < 50; p += 1) {
        const res = await getExactKmo({ ...filters, ...(kmoStatus ? { kmo_status: kmoStatus } : {}), state: "missing", page: p, limit: 200 });
        const pageRows = res?.data ?? [];
        ids.push(...pageRows.map((r) => r.id));
        if (!pageRows.length || p * 200 >= (res?.total_count ?? 0)) break;
      }
      if (!ids.length || !window.confirm(k("confirmAdd", { count: ids.length }))) return;
      let queued = 0;
      let refused = 0;
      for (let i = 0; i < ids.length; i += 200) {
        const res = await addMany(ids.slice(i, i + 200).map((id) => ({ kind: "kmo_invoice", id })));
        queued += res?.data?.queued ?? 0;
        refused += res?.data?.refused ?? 0;
      }
      toast.success(k("added", { queued, refused }));
    } catch (err) {
      toast.error(err?.message || k("addFailed"));
    } finally {
      setBusy(false);
    }
  };

  //* Credit notes whose invoice is in Exact but that aren't queued → To send. Nothing is sent yet.
  const handleAddCredits = async () => {
    setBusy(true);
    try {
      const ids = [];
      for (let p = 1; p < 50; p += 1) {
        const res = await getExactKmo({ ...filters, credit_missing: 1, page: p, limit: 200 });
        const pageRows = res?.data ?? [];
        ids.push(...pageRows.filter((r) => r.credit_note?.state === "missing").map((r) => r.credit_note.id));
        if (!pageRows.length || p * 200 >= (res?.total_count ?? 0)) break;
      }
      if (!ids.length || !window.confirm(k("confirmAddCredits", { count: ids.length }))) return;
      const res = await addMany(ids.map((id) => ({ kind: "credit_note", id })));
      toast.success(k("added", { queued: res?.data?.queued ?? 0, refused: res?.data?.refused ?? 0 }));
    } catch (err) {
      toast.error(err?.message || k("addFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      await downloadCsv(await exportExactKmo(query), `kmo_invoices_exact${state ? `_${state}` : ""}`, "csv");
    } catch (err) {
      toast.error(err?.message || k("exportFailed"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p>{k("rule")}</p>
          <p>{k("flow")}</p>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} columns={6} />
      ) : error ? (
        <ErrorMessage message={error?.message || k("loadFailed")} onRetry={refetch} variant="inline" />
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {(summary.states || []).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pick(s)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${state === s ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 dark:border-white/10"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{k(`state.${s}`)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATE_STYLES[s]}`}>{counts[s] ?? 0}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{k(`hint.${s}`)}</div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCreditMissing((v) => !v);
                setState(null);
                setPage(1);
              }}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${creditMissing ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 dark:border-white/10"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-900 dark:text-white">{k("creditMissing")}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${summary.credit_missing ? STATE_STYLES.missing : STATE_STYLES.ok}`}>
                  {summary.credit_missing ?? 0}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{k("creditMissingHint")}</div>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{k("kmoStatus")}</span>
              <select
                className="rounded-md border dark:border-white/10 bg-transparent px-2 py-1"
                value={kmoStatus}
                onChange={(e) => {
                  setKmoStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{k("allStatuses", { count: summary.total ?? 0 })}</option>
                {KMO_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {k(`kmo.${s}`)} ({summary.kmo_counts?.[s] ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {canModify && creditCounts.missing ? (
                <Button size="sm" variant="outline" onClick={handleAddCredits} disabled={busy || !isConnected}>
                  <ListPlus className="h-4 w-4 mr-2" />
                  {busy ? k("adding") : k("addCredits", { count: creditCounts.missing })}
                </Button>
              ) : null}
              {canModify && counts.missing ? (
                <Button size="sm" onClick={handleAddMissing} disabled={busy || !isConnected}>
                  <ListPlus className="h-4 w-4 mr-2" />
                  {busy ? k("adding") : k("addMissing", { count: counts.missing })}
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={handleExport} disabled={!total}>
                <Download className="h-4 w-4 mr-2" />
                {k("export")}
              </Button>
            </div>
          </div>

          {total === 0 ? (
            <div className="rounded-lg bg-muted/50 border dark:border-white/10 px-4 py-3 text-sm text-muted-foreground">
              {filtersActive || state || kmoStatus || creditMissing ? t("integrations.exact.filters.noMatch") : k("empty")}
            </div>
          ) : (
            <>
              <div className="border dark:border-white/10 rounded-lg overflow-x-auto">
                <Table className="w-full min-w-[1100px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{k("col.invoice")}</TableHead>
                      <TableHead>{k("col.who")}</TableHead>
                      <TableHead>{k("col.module")}</TableHead>
                      <TableHead>{k("col.kmo")}</TableHead>
                      <TableHead className="text-right">{k("col.amount")}</TableHead>
                      <TableHead>{k("col.exact")}</TableHead>
                      <TableHead>{k("col.state")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-mono text-sm">{r.uid}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(r.date)} · {r.invoice_status}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <div className="truncate">{r.company || r.student || "—"}</div>
                          <div className="text-xs text-muted-foreground truncate">{[r.student, r.email].filter(Boolean).join(" · ")}</div>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate" title={r.module || undefined}>{r.module || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {r.kmo_status ? k(`kmo.${r.kmo_status}`) : "—"}
                          {r.project_number ? <div className="text-xs text-muted-foreground">{r.project_number}</div> : null}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">{r.amount}</TableCell>
                        <TableCell className="max-w-[260px]">
                          {r.exact ? (
                            <>
                              <div className="font-mono text-sm">#{r.exact.entry_number}</div>
                              <div className="text-xs text-muted-foreground truncate" title={r.exact.description || undefined}>
                                {[r.exact.your_ref || k("noRef"), r.exact.description || k("noDescription")].join(" · ")}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {r.credit_note ? (
                            <div className={`flex flex-wrap items-center gap-x-2 text-xs ${CREDIT_STYLES[r.credit_note.state] || "text-muted-foreground"}`}>
                              <span>
                                {r.credit_note.uid}
                                {r.credit_note.entry_number ? ` #${r.credit_note.entry_number}` : ` · ${k(`creditState.${r.credit_note.state || "missing"}`)}`}
                              </span>
                              {canModify && r.credit_note.state === "missing" ? (
                                <button
                                  type="button"
                                  className="underline font-medium disabled:opacity-50"
                                  disabled={!isConnected || (addingOne && addingVars?.id === r.credit_note.id)}
                                  onClick={() => addOne({ kind: "credit_note", id: r.credit_note.id })}
                                >
                                  {addingOne && addingVars?.id === r.credit_note.id ? k("adding") : k("addCredit")}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLES[r.state]}`}>{k(`state.${r.state}`)}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalRows={total} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default KmoTab;
