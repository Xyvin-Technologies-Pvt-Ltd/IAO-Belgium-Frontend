import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label
      className="text-xs font-semibold uppercase tracking-wider"
      style={{ color: "#94a3b8" }}
    >
      {label}
    </label>
    {children}
  </div>
);

const TrajectoryStudentsFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
  filterOptions = {},
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState("");
  const [readerSearchTerm, setReaderSearchTerm] = useState("");

  const batches = filterOptions?.batches || [];
  const supervisors = filterOptions?.supervisors || [];
  const readers = filterOptions?.readers || [];

  const filteredBatches = batches.filter((b) =>
    (b.name || "").toLowerCase().includes(batchSearchTerm.toLowerCase())
  );
  const filteredSupervisors = supervisors.filter((s) =>
    (s.name || "").toLowerCase().includes(supervisorSearchTerm.toLowerCase())
  );
  const filteredReaders = readers.filter((r) =>
    (r.name || "").toLowerCase().includes(readerSearchTerm.toLowerCase())
  );

  const batchOptions = [
    { _id: "all", name: t("thesisManagement.filters.allGroups", "All Groups") },
    ...filteredBatches,
  ];

  const supervisorOptions = [
    {
      _id: "all",
      name: t("thesisManagement.filters.allSupervisors", "All Supervisors"),
    },
    ...filteredSupervisors,
  ];

  const readerOptions = [
    {
      _id: "all",
      name: t("thesisManagement.filters.allReaders", "All Readers"),
    },
    ...filteredReaders,
  ];

  const activeFiltersCount = Object.entries(appliedFilters || {}).filter(
    ([, val]) => val !== "all" && val !== undefined && val !== ""
  ).length;

  const handleOpenChange = (open) => {
    if (open) {
      setDraftFilters({ ...appliedFilters });
    }
    setIsOpen(open);
  };

  const handleClearAll = () => {
    const resetObj = {
      batch: "all",
      supervisor: "all",
      reader: "all",
      status: "all",
      attention: "all",
    };
    setDraftFilters(resetObj);
    setAppliedFilters(resetObj);
    if (setPage) setPage(1);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    if (setPage) setPage(1);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          className="relative gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("common.filter", "Filters")}
          {activeFiltersCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                background: "#ef4444",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                width: 20,
                height: 20,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #fff",
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-100 sm:w-120 p-0 bg-sidebar flex flex-col h-full max-h-screen"
      >
        <SheetHeader
          className="p-6 pb-5 shrink-0"
          style={{ borderBottom: "1px solid var(--sidebar-border, #e8edf3)" }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(255,137,4,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SlidersHorizontal size={18} color="#ff8904" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold text-sidebar-foreground">
                {t(
                  "thesisManagement.filters.studentFiltersTitle",
                  "Filter Enrolled Students"
                )}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t(
                  "thesisManagement.filters.studentFiltersSubtitle",
                  "Narrow down the student cohort"
                )}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Cohort & Assignment Card */}
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              {t(
                "thesisManagement.filters.assignmentSection",
                "Cohort & Assignment"
              )}
            </p>

            <FilterSection
              label={t("thesisManagement.table.group", "Group")}
            >
              <SearchableSelect
                placeholder={t(
                  "thesisManagement.filters.allGroups",
                  "All Groups"
                )}
                searchPlaceholder={t("common.search", "Search groups...")}
                items={batchOptions}
                value={
                  draftFilters?.batch === "all" ? "" : draftFilters?.batch
                }
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    batch: val || "all",
                  }))
                }
                onSearch={setBatchSearchTerm}
              />
            </FilterSection>

            <FilterSection
              label={t("thesisManagement.table.supervisor", "Supervisor")}
            >
              <SearchableSelect
                placeholder={t(
                  "thesisManagement.filters.allSupervisors",
                  "All Supervisors"
                )}
                searchPlaceholder={t(
                  "common.search",
                  "Search supervisors..."
                )}
                items={supervisorOptions}
                value={
                  draftFilters?.supervisor === "all"
                    ? ""
                    : draftFilters?.supervisor
                }
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    supervisor: val || "all",
                  }))
                }
                onSearch={setSupervisorSearchTerm}
              />
            </FilterSection>

            <FilterSection
              label={t("thesisManagement.table.reader", "Reader")}
            >
              <SearchableSelect
                placeholder={t(
                  "thesisManagement.filters.allReaders",
                  "All Readers"
                )}
                searchPlaceholder={t("common.search", "Search readers...")}
                items={readerOptions}
                value={
                  draftFilters?.reader === "all" ? "" : draftFilters?.reader
                }
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    reader: val || "all",
                  }))
                }
                onSearch={setReaderSearchTerm}
              />
            </FilterSection>
          </div>

          {/* Progress & Status Card */}
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              {t(
                "thesisManagement.filters.statusSection",
                "Status & Attention"
              )}
            </p>

            <FilterSection
              label={t("thesisManagement.table.status", "Attempt Status")}
            >
              <Select
                value={draftFilters?.status || "all"}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={t(
                      "thesisManagement.attempt.allStatuses",
                      "All statuses"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t(
                      "thesisManagement.attempt.allStatuses",
                      "All statuses"
                    )}
                  </SelectItem>
                  <SelectItem value="active">
                    {t("thesisManagement.attempt.active", "Active")}
                  </SelectItem>
                  <SelectItem value="passed">
                    {t("thesisManagement.attempt.passed", "Passed")}
                  </SelectItem>
                  <SelectItem value="failed">
                    {t("thesisManagement.attempt.failed", "Failed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection
              label={t("thesisManagement.table.attention", "Attention")}
            >
              <Select
                value={draftFilters?.attention || "all"}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, attention: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={t(
                      "thesisManagement.attempt.allAttention",
                      "All attention"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t(
                      "thesisManagement.attempt.allAttention",
                      "All attention"
                    )}
                  </SelectItem>
                  <SelectItem value="suggest_fail">
                    {t(
                      "thesisManagement.attempt.suggestFail",
                      "Overdue — review fail"
                    )}
                  </SelectItem>
                  <SelectItem value="suggest_pass">
                    {t(
                      "thesisManagement.attempt.suggestPass",
                      "Ready for pass"
                    )}
                  </SelectItem>
                  <SelectItem value="none">
                    {t("thesisManagement.attempt.none", "In progress")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>
          </div>
        </div>

        <SheetFooter
          className="mt-auto shrink-0"
          style={{
            background: "var(--sidebar, #fff)",
            borderTop: "1px solid var(--sidebar-border, #e8edf3)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Button
            variant="outline"
            className="w-full border-sidebar-border"
            onClick={handleClearAll}
          >
            {t("common.clearAll", "Clear All")}
          </Button>
          <Button className="w-full" onClick={handleApply}>
            {t("common.applyFilters", "Apply Filters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TrajectoryStudentsFilterDrawer;
