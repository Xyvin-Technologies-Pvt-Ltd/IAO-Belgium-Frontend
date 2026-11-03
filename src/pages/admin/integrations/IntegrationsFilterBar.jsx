import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * One search + date filter for every Integrations tab. Search matches every
 * word against the row's keys (name, email, IAO number, invoice number, Mollie
 * id, Your ref., Exact entry number, company). Dates are inclusive days; which
 * date each tab uses is shown under the fields.
 */
const IntegrationsFilterBar = ({ tab, search, from, to, onSearchChange, onFromChange, onToChange, onClear }) => {
  const { t } = useTranslation();
  const f = (key) => t(`integrations.exact.filters.${key}`);
  const hasFilters = Boolean(search) || Boolean(from) || Boolean(to);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-9"
            placeholder={f("searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={f("searchPlaceholder")}
          />
          {search ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-900 dark:hover:text-white"
              onClick={() => onSearchChange("")}
              aria-label={f("clearSearch")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground" htmlFor="integrations-filter-from">
            {f("from")}
          </label>
          <Input
            id="integrations-filter-from"
            type="date"
            className="w-[150px]"
            value={from}
            max={to || undefined}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground" htmlFor="integrations-filter-to">
            {f("to")}
          </label>
          <Input
            id="integrations-filter-to"
            type="date"
            className="w-[150px]"
            value={to}
            min={from || undefined}
            onChange={(e) => onToChange(e.target.value)}
          />
        </div>

        {hasFilters ? (
          <Button variant="ghost" onClick={onClear}>
            {f("clear")}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t(`integrations.exact.filters.dateHint.${tab}`)}</p>
    </div>
  );
};

export default IntegrationsFilterBar;
