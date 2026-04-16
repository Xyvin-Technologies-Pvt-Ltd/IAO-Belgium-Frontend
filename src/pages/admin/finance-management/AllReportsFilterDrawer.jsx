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
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
      {label}
    </label>
    {children}
  </div>
);

const AllReportsFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = Object.entries(appliedFilters).filter(
    ([, val]) => val !== "all" && val !== ""
  ).length;

  const handleClearAll = () => {
    const reset = { status: "all", purpose: "all", from: "", to: "" };
    setDraftFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant={activeFiltersCount > 0 ? "default" : "outline"} className="relative gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {t("finance.filters.title")}
          {activeFiltersCount > 0 && (
            <span style={{
              position: "absolute", top: -8, right: -8,
              background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700,
              width: 20, height: 20, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #fff",
            }}>
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-100 sm:w-120 p-0 bg-sidebar flex flex-col h-full max-h-screen">
        <SheetHeader
          className="p-6 pb-5 shrink-0"
          style={{ borderBottom: "1px solid var(--sidebar-border, #e8edf3)" }}
        >
          <div className="flex items-center gap-3">
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(255,137,4,0.10)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <SlidersHorizontal size={18} color="#ff8904" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold text-sidebar-foreground">
                {t("finance.filters.filterReports")}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t("finance.filters.narrowDownPayments")}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection label={t("common.status")}>
              <Select
                value={draftFilters.status}
                onValueChange={(val) => setDraftFilters((prev) => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("finance.filters.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("finance.filters.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("common.pending")}</SelectItem>
                  <SelectItem value="paid">{t("common.paid")}</SelectItem>
                  <SelectItem value="failed">{t("common.failed")}</SelectItem>
                  <SelectItem value="canceled">{t("common.canceled")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection label={t("common.purpose")}>
              <Select
                value={draftFilters.purpose}
                onValueChange={(val) => setDraftFilters((prev) => ({ ...prev, purpose: val }))}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue placeholder={t("finance.filters.allPurposes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("finance.filters.allPurposes")}</SelectItem>
                  <SelectItem value="admission-fee">{t("finance.purposes.admissionFee")}</SelectItem>
                  <SelectItem value="module-purchase">{t("finance.purposes.modulePurchase")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>
          </div>

          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
              {t("finance.filters.dateRange")}
            </p>
            <FilterSection label={t("finance.filters.from")}>
              <Input
                type="date"
                className="bg-sidebar border-sidebar-border"
                value={draftFilters.from}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, from: e.target.value }))}
              />
            </FilterSection>
            <FilterSection label={t("finance.filters.to")}>
              <Input
                type="date"
                className="bg-sidebar border-sidebar-border"
                value={draftFilters.to}
                min={draftFilters.from || undefined}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
            </FilterSection>
          </div>
        </div>

        <SheetFooter
          className="mt-auto shrink-0"
          style={{
            background: "var(--sidebar, #fff)",
            borderTop: "1px solid var(--sidebar-border, #e8edf3)",
            padding: "16px 24px",
            display: "flex", flexDirection: "column", gap: 12,
          }}
        >
          <Button variant="outline" className="w-full border-sidebar-border" onClick={handleClearAll}>
            {t("finance.filters.clearAll")}
          </Button>
          <Button className="w-full" onClick={handleApply}>
            {t("finance.filters.applyFilters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AllReportsFilterDrawer;
