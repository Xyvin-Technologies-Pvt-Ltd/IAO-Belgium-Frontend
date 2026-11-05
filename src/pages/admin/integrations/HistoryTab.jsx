import { useTranslation } from "react-i18next";
import ReconciliationTab from "./ReconciliationTab";
import SentTable from "./SentTable";

/**
 * History: everything already in Exact. "Documents" is one row per IAO document
 * (IAO ↔ Mollie ↔ Exact, with Verify and CSV export); "GL lines" is the
 * accounting audit trail, one row per GL line.
 */
const HistoryTab = ({ view, onViewChange, page, setPage, rowsPerPage, setRowsPerPage, filters, filtersActive }) => {
  const { t } = useTranslation();
  const h = (key) => t(`integrations.exact.history.${key}`);

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border dark:border-white/10 p-0.5" role="tablist">
        {["documents", "lines"].map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => onViewChange(v)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              view === v
                ? "bg-blue-600 text-white"
                : "text-muted-foreground hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {h(v)}
          </button>
        ))}
      </div>

      {view === "lines" ? (
        <SentTable
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          filters={filters}
          filtersActive={filtersActive}
        />
      ) : (
        <ReconciliationTab
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          filters={filters}
        />
      )}
    </div>
  );
};

export default HistoryTab;
