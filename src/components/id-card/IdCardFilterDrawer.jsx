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
import { useState, useMemo } from "react";
import { useGetAllPrograms } from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useTranslation } from "react-i18next";
import {
  PROGRAM_TYPES,
  PROGRAM_TYPE_I18N_KEYS,
} from "@/constants/programTypes";

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

const IdCardFilterDrawer = ({
  draftFilters,
  setDraftFilters,
  appliedFilters,
  setAppliedFilters,
  setPage,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [programSearchTerm, setProgramSearchTerm] = useState("");

  const activeFiltersCount = useMemo(() => {
    return Object.entries(appliedFilters || {}).filter(
      ([, val]) => val !== "all" && Boolean(val),
    ).length;
  }, [appliedFilters]);

  const programFilter = useMemo(() => {
    const f = {};
    if (draftFilters?.program_type && draftFilters.program_type !== "all") {
      f.program_type = draftFilters.program_type;
    }
    if (programSearchTerm) {
      f.search = programSearchTerm;
    }
    return f;
  }, [draftFilters?.program_type, programSearchTerm]);

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    programFilter,
    { enabled: isOpen },
  );

  const programItems = useMemo(() => {
    const items = [
      {
        _id: "all",
        name: t("idCardManagement.filters.allPrograms", "All Programmes"),
      },
    ];
    if (Array.isArray(programsData?.data)) {
      for (const p of programsData.data) {
        const details = [p.name, p.city?.name, p.language?.name]
          .filter(Boolean)
          .join(" - ");
        items.push({
          _id: p._id,
          name: details || p.name,
        });
      }
    }
    return items;
  }, [programsData?.data, t]);

  const handleProgramTypeChange = (val) => {
    setDraftFilters((prev) => ({
      ...prev,
      program_type: val,
      program: "all",
    }));
  };

  const handleProgramChange = (val) => {
    setDraftFilters((prev) => ({
      ...prev,
      program: val || "all",
    }));
  };

  const handleClearAll = () => {
    const resetObj = {
      program_type: "all",
      program: "all",
    };
    setDraftFilters(resetObj);
    setAppliedFilters(resetObj);
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
        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          className="relative gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("idCardManagement.filters.button", "Filter")}
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
                {t("idCardManagement.filters.title", "Filter ID Cards")}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {t(
                  "idCardManagement.filters.subtitle",
                  "Narrow down the student ID cards list",
                )}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
            <FilterSection
              label={t(
                "idCardManagement.filters.programType",
                "Programme Type",
              )}
            >
              <Select
                value={draftFilters?.program_type || "all"}
                onValueChange={handleProgramTypeChange}
              >
                <SelectTrigger className="w-full bg-sidebar border-sidebar-border">
                  <SelectValue
                    placeholder={t(
                      "idCardManagement.filters.allProgramTypes",
                      "All Types",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t(
                      "idCardManagement.filters.allProgramTypes",
                      "All Types",
                    )}
                  </SelectItem>
                  {PROGRAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PROGRAM_TYPE_I18N_KEYS[type]
                        ? t(PROGRAM_TYPE_I18N_KEYS[type], type)
                        : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection
              label={t("idCardManagement.filters.program", "Programme")}
            >
              <SearchableSelect
                placeholder={t(
                  "idCardManagement.filters.allPrograms",
                  "All Programmes",
                )}
                searchPlaceholder={t(
                  "common.search",
                  "Search programmes...",
                )}
                items={programItems}
                value={
                  draftFilters?.program === "all"
                    ? ""
                    : draftFilters?.program || ""
                }
                onChange={handleProgramChange}
                onSearch={setProgramSearchTerm}
                isLoading={programsLoading}
                className="w-full"
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
            {t("idCardManagement.filters.clearAll", "Clear All")}
          </Button>
          <Button className="w-full" onClick={handleApply}>
            {t("idCardManagement.filters.applyFilters", "Apply Filters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default IdCardFilterDrawer;
