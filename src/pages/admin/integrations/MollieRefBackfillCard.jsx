import { Link2, Play, FlaskConical } from "lucide-react";
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
  useGetMollieRefBackfillStatus,
  useStartMollieRefBackfill,
} from "@/store/useExactStore";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const STATE_STYLES = {
  idle: "bg-muted text-muted-foreground",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  done: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
};

/**
 * Admin trigger for the Mollie tr_ → Exact YourRef backfill (xCore matching).
 * The run happens in the background on the API; this card polls its status.
 */
const MollieRefBackfillCard = ({ isConnected, canModify }) => {
  const { t } = useTranslation();
  const { data } = useGetMollieRefBackfillStatus();
  const { mutate: start, isPending: isStarting } = useStartMollieRefBackfill();

  const status = data?.data || { state: "idle" };
  const summary = status.summary || {};
  const isRunning = status.state === "running";
  const disabled = !isConnected || isRunning || isStarting;

  const issues = [
    ...(summary.skipped || []).map((row) => ({ ...row, kind: "skipped" })),
    ...(summary.failed || []).map((row) => ({ ...row, kind: "failed" })),
  ];

  const handleApplyAll = () => {
    if (window.confirm(t("integrations.exact.mollieRef.confirmApplyAll"))) {
      start({ apply: true });
    }
  };

  const counts = [
    {
      label: status.dry_run
        ? t("integrations.exact.mollieRef.wouldUpdate")
        : t("integrations.exact.mollieRef.updated"),
      value: status.dry_run ? summary.would_update : summary.updated,
    },
    { label: t("integrations.exact.mollieRef.alreadySet"), value: summary.already_set },
    {
      label: t("integrations.exact.mollieRef.skipped"),
      value: summary.skipped?.length,
    },
    {
      label: t("integrations.exact.mollieRef.failed"),
      value: summary.failed?.length,
    },
  ];

  return (
    <div className="rounded-lg border dark:border-white/10 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            {t("integrations.exact.mollieRef.title")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-3xl">
            {t("integrations.exact.mollieRef.hint")}
          </p>
        </div>
        <span
          className={`self-start whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATE_STYLES[status.state] || STATE_STYLES.idle
          }`}
        >
          {t(`integrations.exact.mollieRef.state.${status.state || "idle"}`)}
          {status.state !== "idle" &&
            ` · ${
              status.dry_run
                ? t("integrations.exact.mollieRef.modeDryRun")
                : t("integrations.exact.mollieRef.modeApply")
            }`}
        </span>
      </div>

      {canModify && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => start({})} disabled={disabled}>
            <FlaskConical className="w-4 h-4 mr-2" />
            {t("integrations.exact.mollieRef.dryRun")}
          </Button>
          <Button
            variant="outline"
            onClick={() => start({ apply: true, limit: 1 })}
            disabled={disabled}
          >
            <Play className="w-4 h-4 mr-2" />
            {t("integrations.exact.mollieRef.applyOne")}
          </Button>
          <Button onClick={handleApplyAll} disabled={disabled}>
            <Play className={`w-4 h-4 mr-2 ${isRunning ? "animate-pulse" : ""}`} />
            {isRunning
              ? t("integrations.exact.mollieRef.running")
              : t("integrations.exact.mollieRef.applyAll")}
          </Button>
        </div>
      )}

      {status.state !== "idle" && (
        <div className="space-y-3 text-sm">
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {t("integrations.exact.mollieRef.startedAt", {
                date: formatDateTime(status.started_at),
              })}
            </span>
            {status.finished_at && (
              <span>
                {t("integrations.exact.mollieRef.finishedAt", {
                  date: formatDateTime(status.finished_at),
                })}
              </span>
            )}
            {summary.total != null && (
              <span>
                {t("integrations.exact.mollieRef.progress", {
                  done: summary.candidates ?? 0,
                  total: summary.total,
                })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {counts.map((count) => (
              <div key={count.label} className="rounded-md bg-muted/50 px-3 py-2">
                <div className="text-xs text-muted-foreground">{count.label}</div>
                <div className="text-lg font-semibold">{count.value ?? 0}</div>
              </div>
            ))}
          </div>

          {status.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
              {status.error}
            </div>
          )}

          {issues.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">{t("integrations.exact.mollieRef.issues")}</div>
              <div className="border dark:border-white/10 rounded-lg overflow-x-auto max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("integrations.exact.mollieRef.table.record")}</TableHead>
                      <TableHead>{t("integrations.exact.mollieRef.table.transaction")}</TableHead>
                      <TableHead>{t("integrations.exact.mollieRef.table.reason")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((row) => (
                      <TableRow key={`${row.kind}-${row.label}-${row.transaction_id}`}>
                        <TableCell className="font-mono text-xs">{row.label}</TableCell>
                        <TableCell className="font-mono text-xs">{row.transaction_id}</TableCell>
                        <TableCell className={row.kind === "failed" ? "text-red-600" : ""}>
                          {row.kind === "failed"
                            ? `${t("integrations.exact.mollieRef.failed")}: ${row.error}`
                            : t(`integrations.exact.mollieRef.reasons.${row.reason}`, {
                                defaultValue: row.reason,
                              })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MollieRefBackfillCard;
