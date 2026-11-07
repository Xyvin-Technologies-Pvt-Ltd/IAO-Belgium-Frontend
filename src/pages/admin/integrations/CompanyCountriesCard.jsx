import { useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Wand2 } from "lucide-react";
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
import ErrorMessage from "@/components/common/ErrorMessage";
import { useApplyCompanyCountries, useGetCompanyCountries } from "@/store/useExactStore";
import CompanyEditDialog from "@/components/admin/student/CompanyEditDialog";

const PREVIEW_ROWS = 8;

/**
 * Settings → Company countries. Old companies hold free-text countries
 * ("Belgique", "Danmark") that Exact refuses when it creates the customer.
 * "Fix" writes the country code on every company we can recognise (nothing is
 * sent to Exact); the rest are fixed one by one with the country dropdown.
 */
const CompanyCountriesCard = ({ canModify }) => {
  const { t } = useTranslation();
  const k = (key, opts) => t(`integrations.exact.companyCountries.${key}`, opts);
  const [showAll, setShowAll] = useState(false);
  const [editId, setEditId] = useState(null);
  const { data, isLoading, error, refetch } = useGetCompanyCountries();
  const { mutate: apply, isPending } = useApplyCompanyCountries();

  const report = data?.data;
  const totals = report?.totals ?? {};
  const fixable = report?.fixable ?? [];
  const unknown = report?.unknown ?? [];
  const issues = report?.master_data_issues ?? [];
  const shown = showAll ? fixable : fixable.slice(0, PREVIEW_ROWS);

  const handleFix = () => {
    if (!window.confirm(k("confirmFix", { count: fixable.length }))) return;
    apply();
  };

  return (
    <div className="rounded-lg border dark:border-white/10 px-4 py-3 space-y-3 text-sm">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{k("title")}</p>
        <p className="text-muted-foreground">{k("hint")}</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{k("loading")}</p>
      ) : error ? (
        <ErrorMessage message={error?.message || k("loadFailed")} onRetry={refetch} variant="inline" />
      ) : (
        <>
          <p className="text-muted-foreground">
            {k("summary", {
              companies: totals.companies ?? 0,
              ok: totals.ok ?? 0,
              blank: totals.blank ?? 0,
              fixable: totals.fixable ?? 0,
              unknown: totals.unknown ?? 0,
              unsent: totals.unsent_blocked ?? 0,
            })}
          </p>

          {issues.length ? (
            <div className="flex gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                {issues.map((i) => (
                  <div key={i.id}>{k("masterDataIssue", { name: i.name, code: i.code, expected: i.expected })}</div>
                ))}
              </div>
            </div>
          ) : null}

          {fixable.length === 0 && unknown.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {k("allClean")}
            </div>
          ) : null}

          {fixable.length ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{k("fixableTitle", { count: fixable.length })}</p>
                {canModify ? (
                  <Button size="sm" onClick={handleFix} disabled={isPending}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isPending ? k("fixing") : k("fix", { count: fixable.length })}
                  </Button>
                ) : null}
              </div>
              <div className="border dark:border-white/10 rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{k("col.company")}</TableHead>
                      <TableHead>{k("col.now")}</TableHead>
                      <TableHead>{k("col.becomes")}</TableHead>
                      <TableHead className="text-right">{k("col.unsent")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shown.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.name}
                          {row.in_exact ? <span className="ml-2 text-xs text-muted-foreground">{k("inExact")}</span> : null}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.from}</TableCell>
                        <TableCell className="font-mono text-xs">{row.to}</TableCell>
                        <TableCell className="text-right">{row.unsent || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {fixable.length > PREVIEW_ROWS ? (
                <Button size="sm" variant="ghost" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? k("showLess") : k("showAll", { count: fixable.length })}
                </Button>
              ) : null}
            </div>
          ) : null}

          {unknown.length ? (
            <div className="space-y-2">
              <p className="font-medium">{k("unknownTitle", { count: unknown.length })}</p>
              <div className="border dark:border-white/10 rounded-md divide-y dark:divide-white/10">
                {unknown.map((row) => (
                  <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span>
                      {row.name} · <span className="font-mono text-xs">"{row.country}"</span>
                      {row.unsent ? <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">{k("unsentCount", { count: row.unsent })}</span> : null}
                      {row.in_exact ? <span className="ml-2 text-xs text-muted-foreground">{k("inExact")}</span> : null}
                    </span>
                    {canModify ? (
                      <Button size="sm" variant="outline" onClick={() => setEditId(row.id)}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        {k("pickCountry")}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">{k("afterFix")}</p>
        </>
      )}

      <CompanyEditDialog companyId={editId} onClose={() => setEditId(null)} />
    </div>
  );
};

export default CompanyCountriesCard;
