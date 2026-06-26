import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { Label } from "@/components/ui/label";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import CreateComponent from "./CreateComponent";
import ViewComponent from "./ViewComponent";
import {
  useGetComponents,
  useGetComponentFilterOptions,
} from "@/store/useComponentStore";
import StatusBadge from "@/components/StatusBadge";
import { useGetProgramById } from "@/store/useProgramStore";

const SORT_MAP = {
  uid: { sort_by: "uid", sort_order: "asc" },
  name_asc: { sort_by: "name", sort_order: "asc" },
  name_desc: { sort_by: "name", sort_order: "desc" },
  year_asc: { sort_by: "year", sort_order: "asc" },
  year_desc: { sort_by: "year", sort_order: "desc" },
};

const LearningModule = ({ programId, onComponentCreated,languageId }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedModuleNumbers, setSelectedModuleNumbers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortValue, setSortValue] = useState("uid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const debouncedSearch = useDebounce(search, 500);

  const { data: programRes } = useGetProgramById(programId, { enabled: !!programId });
  const program = programRes?.data;

  const isLevel = program?.duration_unit && program.duration_unit !== "years";
  const yearFieldLabel = isLevel
    ? t("learningModule.table.level", "Level")
    : t("learningModule.table.year");

  const { data: filterOptionsRes } = useGetComponentFilterOptions(
    { program: programId, type: "module" },
    { enabled: !!programId },
  );
  const yearOptions = (filterOptionsRes?.data?.years || []).map((y) => ({
    _id: String(y),
    name: String(y),
  }));
  const moduleNumberOptions = (
    filterOptionsRes?.data?.module_numbers || []
  ).map((m) => ({ _id: String(m), name: String(m) }));

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    selectedYears,
    selectedModuleNumbers,
    statusFilter,
    sortValue,
  ]);

  const sortParams = SORT_MAP[sortValue] || SORT_MAP.uid;

  const { data, isLoading, error, refetch,isFetching } = useGetComponents({
    type: "module",
    program: programId,
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(selectedYears.length
      ? { year: selectedYears.map((y) => y._id).join(",") }
      : {}),
    ...(selectedModuleNumbers.length
      ? { module_number: selectedModuleNumbers.map((m) => m._id).join(",") }
      : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...sortParams,
  });

  const modules = data?.data || [];
  const totalRows = data?.total_count || 0;

 
  const handleOpenEdit = (i) => {
    setSelectedModule(i);
    setIsModalOpen(true);
  };

  const handleViewModule = (module) => {
    setSelectedModule(module);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("learningModule.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => {
          setSelectedModule(null);
          setIsModalOpen(true);
        }}>
          {t("programDetail.emptyState.createButton")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SearchableMultiSelect
          label={yearFieldLabel}
          placeholder={t("learningModule.filters.yearPlaceholder")}
          searchPlaceholder={t("common.search", "Search...")}
          items={yearOptions}
          selected={selectedYears}
          onChange={setSelectedYears}
        />
        <SearchableMultiSelect
          label={t("learningModule.filters.moduleNumberLabel")}
          placeholder={t("learningModule.filters.moduleNumberPlaceholder")}
          searchPlaceholder={t("common.search", "Search...")}
          items={moduleNumberOptions}
          selected={selectedModuleNumbers}
          onChange={setSelectedModuleNumbers}
        />
        <div className="space-y-2">
          <Label>{t("learningModule.filters.statusLabel")}</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("learningModule.filters.all")}
              </SelectItem>
              <SelectItem value="active">
                {t("learningModule.filters.active")}
              </SelectItem>
              <SelectItem value="inactive">
                {t("learningModule.filters.inactive")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("learningModule.sort.sortByLabel")}</Label>
          <Select value={sortValue} onValueChange={setSortValue}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uid">
                {t("learningModule.sort.learningUid")}
              </SelectItem>
              <SelectItem value="name_asc">
                {t("learningModule.sort.nameAsc")}
              </SelectItem>
              <SelectItem value="name_desc">
                {t("learningModule.sort.nameDesc")}
              </SelectItem>
              <SelectItem value="year_asc">
                {t("learningModule.sort.yearAsc")}
              </SelectItem>
              <SelectItem value="year_desc">
                {t("learningModule.sort.yearDesc")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("learningModule.table.learningUID")}</TableHead>
            <TableHead>{t("learningModule.table.moduleName")}</TableHead>
            <TableHead>
              {program?.duration_unit && program.duration_unit !== "years"
                ? t("learningModule.table.level", "Level")
                : t("learningModule.table.year")}
            </TableHead>
            <TableHead>{t("learningModule.table.moduleNumber")}</TableHead>
            <TableHead>{t("learningModule.table.files")}</TableHead>
            <TableHead>{t("learningModule.table.amount")}</TableHead>
            <TableHead>{t("learningModule.table.status")}</TableHead>
            <TableHead>{t("learningModule.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={8} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("learningModule.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : modules?.length > 0 ? (
            modules?.map((i) => (
              <TableRow 
                key={i._id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleViewModule(i)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.year}</TableCell>
                <TableCell>{i?.module_number}</TableCell>
                <TableCell>{i?.files?.length}</TableCell>
                <TableCell>
                  {i?.currency
                    ? `${i.currency} ${i.amount || 0}`
                    : i?.amount || 0}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("learningModule.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                {t("learningModule.table.noModules")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />

      <CreateComponent
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        componentData={selectedModule}
        programId={programId}
        preselectedType="module"
        onComponentCreated={(componentType) => {
          setSelectedModule(null);
          setIsModalOpen(false);
          if (onComponentCreated) {
            onComponentCreated(componentType);
          }
        }}
        programLanguageId={languageId}
      />

      <ViewComponent
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        componentData={selectedModule}
        program={program}
      />
    </div>
  );
};

export default LearningModule;
