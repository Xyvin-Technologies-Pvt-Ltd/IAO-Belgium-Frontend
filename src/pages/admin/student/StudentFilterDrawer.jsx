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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
  useGetAllPrograms,
  useGetBatches,
  useGetComponents,
} from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_STUDENT_FILTERS,
  getThisWeekDateRange,
} from "./studentFilterUtils";
import { PAYMENT_METHOD_FILTER_OPTIONS } from "@/utils/paymentMethod";

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

const yesNoOptions = (t) => [
  { label: t("studentManagement.filters.all", "All"), value: "all" },
  { label: t("common.yes", "Yes"), value: "true" },
  { label: t("common.no", "No"), value: "false" },
];

const StudentFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [moduleSearchTerm, setModuleSearchTerm] = useState("");

  const { data: programsData } = useGetAllPrograms({}, { enabled: isOpen });
  const selectedProgramId =
    draftFilters.program !== "all" ? draftFilters.program : null;

  const { data: batchesData } = useGetBatches(
    selectedProgramId,
    {},
    { enabled: isOpen && !!selectedProgramId },
  );

  const { data: modulesData, isLoading: modulesLoading } = useGetComponents(
    {
      type: "module",
      limit: 100,
      ...(moduleSearchTerm && { search: moduleSearchTerm }),
    },
    { enabled: isOpen },
  );

  const activeFiltersCount = Object.entries(appliedFilters).filter(
    ([key, val]) => {
      if (key === "program") return val !== "all";
      if (
        [
          "has_outstanding_invoices",
          "has_missed_modules",
          "has_unpurchased_modules",
        ].includes(key)
      ) {
        return val === true;
      }
      if (typeof val === "string") return val !== "" && val !== "all";
      return false;
    },
  ).length;

  const handleClearAll = () => {
    setDraftFilters({ ...DEFAULT_STUDENT_FILTERS });
    setAppliedFilters({ ...DEFAULT_STUDENT_FILTERS });
    setPage(1);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setIsOpen(false);
  };

  const handleThisWeek = () => {
    const { from, to } = getThisWeekDateRange();
    setDraftFilters((prev) => ({
      ...prev,
      module_start_from: from,
      module_start_to: to,
    }));
  };

  const statuses = [
    { label: t("common.active", "Active"), value: "active" },
    { label: t("common.inactive", "Inactive"), value: "inactive" },
  ];

  const paymentStatuses = [
    { label: t("common.pending", "Pending"), value: "pending" },
    { label: t("common.paid", "Paid"), value: "paid" },
    { label: t("common.failed", "Failed"), value: "failed" },
  ];

  const paymentMethods = PAYMENT_METHOD_FILTER_OPTIONS.map((item) => ({
    label: t(item.labelKey, item.fallback),
    value: item.value,
  }));

  const moduleSelected = draftFilters.module !== "all";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          className="relative gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("studentManagement.filters.title", "Filters")}
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
                {t("studentManagement.filters.title", "Filter Students")}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t("studentManagement.filters.subtitle", "Narrow down the students list")}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("studentManagement.table.program", "Programme")}>
              <Select
                value={draftFilters.program}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    program: val,
                    batch: "all",
                  }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("studentManagement.filters.allPrograms", "All Programs")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("studentManagement.filters.allPrograms", "All Programs")}</SelectItem>
                  {programsData?.data?.map((program) => (
                    <SelectItem key={program._id} value={program._id}>
                      {program.name} - {program.city?.name || "N/A"} -{" "}
                      {program.language?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label={t("studentManagement.table.batch", "Group")}>
              <Select
                value={draftFilters.batch}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, batch: val }))
                }
                disabled={!selectedProgramId}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("studentManagement.filters.allBatches", "All Groups")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("studentManagement.filters.allBatches", "All Groups")}</SelectItem>
                  {batchesData?.data?.map((batch) => (
                    <SelectItem key={batch._id} value={batch._id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label={t("studentManagement.table.status", "Status")}>
              <Select
                value={draftFilters.status}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("studentManagement.filters.allStatuses", "All Statuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("studentManagement.filters.allStatuses", "All Statuses")}</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                {t(
                  "studentManagement.filters.inactiveIncludesNotStarted",
                  "Inactive includes students who have not started an application.",
                )}
              </p>
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("studentManagement.filters.paymentStatus", "Payment Status")}>
              <Select
                value={draftFilters.payment_status}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, payment_status: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("studentManagement.filters.all", "All")}</SelectItem>
                  {paymentStatuses.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label={t("studentManagement.filters.paymentMethod", "Payment Method")}>
              <Select
                value={draftFilters.payment_method}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, payment_method: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("studentManagement.filters.all", "All")}</SelectItem>
                  {paymentMethods.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("studentManagement.filters.module", "Module")}>
              <SearchableSelect
                placeholder={t("studentManagement.filters.allModules", "All Modules")}
                searchPlaceholder={t("studentManagement.filters.searchModules", "Search modules")}
                items={modulesData?.data || []}
                value={draftFilters.module === "all" ? "" : draftFilters.module}
                onChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    module: val || "all",
                    module_start_from: val ? prev.module_start_from : "",
                    module_start_to: val ? prev.module_start_to : "",
                  }))
                }
                onSearch={setModuleSearchTerm}
                isLoading={modulesLoading}
                renderItem={(item) => `${item.uid || ""} ${item.name || ""}`.trim()}
              />
            </FilterSection>

            {moduleSelected && (
              <>
                <FilterSection label={t("studentManagement.filters.moduleStartDate", "Module Start Date")}>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={draftFilters.module_start_from}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          module_start_from: e.target.value,
                        }))
                      }
                    />
                    <Input
                      type="date"
                      value={draftFilters.module_start_to}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          module_start_to: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleThisWeek}
                  >
                    {t("studentManagement.filters.thisWeek", "This week")}
                  </Button>
                </FilterSection>
              </>
            )}
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("studentManagement.filters.loginDate", "Login Date")}>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={draftFilters.last_login_from}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      last_login_from: e.target.value,
                    }))
                  }
                />
                <Input
                  type="date"
                  value={draftFilters.last_login_to}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      last_login_to: e.target.value,
                    }))
                  }
                />
              </div>
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("studentManagement.filters.idCard", "ID Card Uploaded")}>
              <Select
                value={draftFilters.has_id_card}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({ ...prev, has_id_card: val }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yesNoOptions(t).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label={t("studentManagement.filters.qualificationCert", "Qualification Certificate")}>
              <Select
                value={draftFilters.has_qualification_certificate}
                onValueChange={(val) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    has_qualification_certificate: val,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yesNoOptions(t).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
              {t("studentManagement.filters.flags", "Flags")}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draftFilters.has_outstanding_invoices}
                onCheckedChange={(checked) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    has_outstanding_invoices: checked === true,
                  }))
                }
              />
              {t("studentManagement.filters.outstandingInvoices", "Outstanding invoices")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draftFilters.has_missed_modules}
                onCheckedChange={(checked) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    has_missed_modules: checked === true,
                  }))
                }
              />
              {t("studentManagement.filters.missedModules", "Missed modules (absent or unpurchased)")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draftFilters.has_unpurchased_modules}
                onCheckedChange={(checked) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    has_unpurchased_modules: checked === true,
                  }))
                }
              />
              {t("studentManagement.filters.unpurchasedModules", "Unpurchased modules only")}
            </label>
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
            {t("studentManagement.filters.clearAll", "Clear All")}
          </Button>
          <Button className="w-full" onClick={handleApply}>
            {t("studentManagement.filters.apply", "Apply Filters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default StudentFilterDrawer;
