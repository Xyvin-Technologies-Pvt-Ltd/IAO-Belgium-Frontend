import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Plug } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useGetExactStatus, useGetExactSendMode, useGetExactToSend } from "@/store/useExactStore";
import { useTranslation } from "react-i18next";
import { useCanModify } from "@/hooks/useCanModify";
import ToSendTab from "./ToSendTab";
import HistoryTab from "./HistoryTab";
import PayoutsTab from "./PayoutsTab";
import SettingsTab from "./SettingsTab";
import GuideTab from "./GuideTab";
import IntegrationsFilterBar from "./IntegrationsFilterBar";
import { useDebounce } from "@/hooks/useDebounce";

const apiBase = import.meta.env.VITE_APP_API_URL || "http://localhost:3005/api/v1/";

//* To send: what still has to reach Exact (Waiting / Failed / Missing).
//* Payouts: Mollie payouts and whether xCore can match them.
//* History: what is already in Exact. Settings: send mode, checks, tools.
//* Guide: how it all works, what to watch out for, what is next.
const TABS = ["to_send", "payouts", "history", "settings", "guide"];
//* Tabs without the search / date filter.
const NO_FILTER_TABS = ["settings", "guide"];

function formatExpiryDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const IntegrationsPage = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("finance");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("to_send");
  const [toSendView, setToSendView] = useState("waiting");
  const [historyView, setHistoryView] = useState("documents");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  //* One search + date filter shared by To send and History.
  const [searchInput, setSearchInput] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const filters = useMemo(
    () => ({
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(filterFrom ? { from: filterFrom } : {}),
      ...(filterTo ? { to: filterTo } : {}),
    }),
    [debouncedSearch, filterFrom, filterTo],
  );
  const filtersActive = Object.keys(filters).length > 0;

  const { data: statusResponse, isLoading, error, refetch } = useGetExactStatus();
  const { data: sendModeResponse } = useGetExactSendMode();
  //* Badge on the To send tab while another tab is open.
  const { data: toSendResponse } = useGetExactToSend({}, { enabled: tab !== "to_send" });

  const status = statusResponse?.data;
  const isConnected = Boolean(status?.connected);
  const sendMode = sendModeResponse?.data?.mode === "auto" ? "auto" : "manual";
  const toSendCounts = toSendResponse?.counts_all ?? toSendResponse?.counts ?? {};
  const toSendWaiting = (toSendCounts.held || 0) + (toSendCounts.failed || 0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exactResult = params.get("exact");
    if (!exactResult) return;

    if (exactResult === "connected") {
      toast.success(t("integrations.exact.oauthConnected"));
      queryClient.invalidateQueries({ queryKey: ["exact-status"] });
      queryClient.invalidateQueries({ queryKey: ["exact-to-send"] });
      queryClient.invalidateQueries({ queryKey: ["exact-missing"] });
      refetch();
    } else if (exactResult === "error") {
      toast.error(t("integrations.exact.oauthFailed"));
    }

    params.delete("exact");
    const remaining = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${remaining ? `?${remaining}` : ""}`);
  }, [queryClient, refetch, t]);

  //* Filter / tab / view changes start at page 1 (set here, not in an effect).
  const resetPage = (fn) => (value) => {
    fn(value);
    setPage(1);
  };
  const changeSearch = resetPage(setSearchInput);
  const changeFrom = resetPage(setFilterFrom);
  const changeTo = resetPage(setFilterTo);
  const switchTab = resetPage(setTab);
  const changeHistoryView = resetPage(setHistoryView);
  //* Payouts → click a transaction's status: open that record in To send / History.
  const openRecord = ({ tab: target, view, search }) => {
    setTab(target);
    if (target === "to_send") setToSendView(view);
    if (target === "history") setHistoryView(view);
    setSearchInput(search || "");
    setFilterFrom("");
    setFilterTo("");
    setPage(1);
  };
  const clearFilters = () => {
    setSearchInput("");
    setFilterFrom("");
    setFilterTo("");
    setPage(1);
  };

  //* Which date the filter uses, shown under the fields.
  let filterHintKey = "to_send";
  if (tab === "history" || tab === "payouts") filterHintKey = tab;
  else if (toSendView === "missing") filterHintKey = "missing";

  if (isLoading) {
    return (
      <div className="space-y-6 mt-4 w-full">
        <TableSkeleton rows={3} columns={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 w-full">
        <ErrorMessage message={error?.message || t("integrations.exact.loadFailed")} onRetry={refetch} variant="card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4 w-full">
      <div>
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">{t("integrations.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("integrations.subtitle")}</p>
      </div>

      <div className="rounded-xl border dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 shrink-0">
              <Plug className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("integrations.exact.title")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("integrations.exact.description")}</p>
              {isConnected ? (
                <p className="text-xs text-muted-foreground mt-2">
                  {status.division != null ? `${t("integrations.exact.division")}: ${status.division}` : null}
                  {status.expires_at ? (
                    <>
                      {" · "}
                      {t("integrations.exact.tokenExpires")}: {formatExpiryDate(status.expires_at)}
                      {!status.token_valid ? ` (${t("integrations.exact.autoRefreshNote")})` : ""}
                    </>
                  ) : null}
                  {" · "}
                  {t("integrations.exact.sendMode.title")}:{" "}
                  {sendMode === "auto" ? t("integrations.exact.sendMode.auto") : t("integrations.exact.sendMode.manual")}
                </p>
              ) : null}
            </div>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              isConnected
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {isConnected ? t("integrations.exact.connected") : t("integrations.exact.disconnected")}
          </span>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("integrations.exact.authoriseHint")}</p>
            {canModify && (
              <Button onClick={() => (window.location.href = `${apiBase}/exact/auth`)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                {t("integrations.exact.authorise")}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-5 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("integrations.exact.syncTitle")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("integrations.exact.syncDescription")}</p>
        </div>

        <div className="flex gap-2 border-b dark:border-white/10 pb-0">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {t(`integrations.exact.tabs.${key}`)}
              {key === "to_send" && tab !== "to_send" && toSendWaiting > 0 ? ` (${toSendWaiting})` : ""}
            </button>
          ))}
        </div>

        {!NO_FILTER_TABS.includes(tab) ? (
          <IntegrationsFilterBar
            tab={filterHintKey}
            search={searchInput}
            from={filterFrom}
            to={filterTo}
            onSearchChange={changeSearch}
            onFromChange={changeFrom}
            onToChange={changeTo}
            onClear={clearFilters}
          />
        ) : null}

        {tab === "to_send" ? (
          <ToSendTab
            isConnected={isConnected}
            canModify={canModify}
            mode={sendMode}
            filters={filters}
            filtersActive={filtersActive}
            view={toSendView}
            onViewChange={setToSendView}
          />
        ) : tab === "payouts" ? (
          <PayoutsTab
            isConnected={isConnected}
            canModify={canModify}
            page={page}
            setPage={setPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            filters={filters}
            filtersActive={filtersActive}
            onOpenRecord={openRecord}
          />
        ) : tab === "history" ? (
          <HistoryTab
            view={historyView}
            onViewChange={changeHistoryView}
            page={page}
            setPage={setPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            filters={filters}
            filtersActive={filtersActive}
          />
        ) : tab === "settings" ? (
          <SettingsTab isConnected={isConnected} canModify={canModify} />
        ) : (
          <GuideTab />
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;
