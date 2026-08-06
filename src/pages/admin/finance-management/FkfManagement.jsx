import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MoreVertical } from "lucide-react";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import StatusBadge from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useGetAllPrograms,
  useGetBatches,
} from "@/store/useDropdownStore";
import {
  useCancelFkfInvoice,
  useCreateFkfBulkInvoices,
  useCreateFkfInvoice,
  useExportFkfStudents,
  useGetFkfConfig,
  useGetFkfEligibleStudents,
  useGetFkfInvoices,
  useGetFkfModules,
  useGetFkfStudentModules,
  useGetFkfStudents,
  useMarkFkfEligible,
  usePreviewFkfBulkInvoices,
  useUnmarkFkfEligible,
  useUpdateFkfConfig,
} from "@/store/useFkfStore";
import { useCanModify } from "@/hooks/useCanModify";

const studentName = (s) =>
  `${s?.first_name || ""} ${s?.last_name || ""}`.trim() || s?.email || "-";

const formatMoney = (currency, amount) => {
  if (amount == null || amount === "") return "-";
  const symbol = currency === "EUR" ? "€" : currency || "EUR";
  return `${symbol} ${Number(amount).toFixed(2)}`;
};

const programLabel = (p) =>
  [p?.name, p?.language?.name, p?.city?.name].filter(Boolean).join(" · ");


const FkfManagement = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("finance");
  const [activeTab, setActiveTab] = useState("students");

  // Students tab
  const [studentsSearch, setStudentsSearch] = useState("");
  const [studentsProgram, setStudentsProgram] = useState("");
  const [studentsBatch, setStudentsBatch] = useState("");
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsRowsPerPage, setStudentsRowsPerPage] = useState(20);
  const [studentsSelectedIds, setStudentsSelectedIds] = useState([]);

  // Eligible tab
  const [eligibleSearch, setEligibleSearch] = useState("");
  const [eligibleProgram, setEligibleProgram] = useState("");
  const [eligibleBatch, setEligibleBatch] = useState("");
  const [eligiblePage, setEligiblePage] = useState(1);
  const [eligibleRowsPerPage, setEligibleRowsPerPage] = useState(20);
  const [eligibleSelectedIds, setEligibleSelectedIds] = useState([]);

  // History
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("all");
  const [historyProgram, setHistoryProgram] = useState("all");
  const [historyBatch, setHistoryBatch] = useState("all");

  // Dialogs
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [componentId, setComponentId] = useState("");
  const [subsidizedAmount, setSubsidizedAmount] = useState("");
  const [bulkModuleId, setBulkModuleId] = useState("");
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkProgram, setBulkProgram] = useState("");
  const [bulkBatch, setBulkBatch] = useState("");
  const [bulkStep, setBulkStep] = useState("form"); // form | preview
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkProgramSearch, setBulkProgramSearch] = useState("");
  const [studentsProgramSearch, setStudentsProgramSearch] = useState("");
  const [eligibleProgramSearch, setEligibleProgramSearch] = useState("");
  const [historyProgramSearch, setHistoryProgramSearch] = useState("");
  const [postalText, setPostalText] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);

  const debouncedStudentsSearch = useDebounce(studentsSearch, 400);
  const debouncedEligibleSearch = useDebounce(eligibleSearch, 400);
  const debouncedHistorySearch = useDebounce(historySearch, 400);

  const { data: programsData } = useGetAllPrograms();
  const programsList = programsData?.data || [];

  const { data: studentsBatchesData } = useGetBatches(
    studentsProgram || null,
    {},
    { enabled: Boolean(studentsProgram) },
  );
  const studentsBatchesList = studentsBatchesData?.data || [];

  const { data: eligibleBatchesData } = useGetBatches(
    eligibleProgram || null,
    {},
    { enabled: Boolean(eligibleProgram) },
  );
  const eligibleBatchesList = eligibleBatchesData?.data || [];

  const historyProgramId = historyProgram !== "all" ? historyProgram : null;
  const { data: historyBatchesData } = useGetBatches(
    historyProgramId,
    {},
    { enabled: Boolean(historyProgramId) },
  );
  const historyBatchesList = historyBatchesData?.data || [];

  const { data: bulkBatchesData } = useGetBatches(
    bulkProgram || null,
    {},
    { enabled: Boolean(bulkProgram) && bulkOpen },
  );
  const bulkBatchesList = bulkBatchesData?.data || [];

  const studentsParams = {
    page: studentsPage,
    limit: studentsRowsPerPage,
    apply_postal_filter: "true",
    ...(debouncedStudentsSearch ? { search: debouncedStudentsSearch } : {}),
    ...(studentsProgram ? { program: studentsProgram } : {}),
    ...(studentsBatch ? { batch: studentsBatch } : {}),
  };

  const {
    data: studentsRes,
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents,
    isFetching: studentsFetching,
  } = useGetFkfStudents(studentsParams, {
    enabled: activeTab === "students",
  });

  const eligibleParams = {
    page: eligiblePage,
    limit: eligibleRowsPerPage,
    ...(debouncedEligibleSearch ? { search: debouncedEligibleSearch } : {}),
    ...(eligibleProgram ? { program: eligibleProgram } : {}),
    ...(eligibleBatch ? { batch: eligibleBatch } : {}),
  };

  const {
    data: eligibleRes,
    isLoading: eligibleLoading,
    error: eligibleError,
    refetch: refetchEligible,
    isFetching: eligibleFetching,
  } = useGetFkfEligibleStudents(eligibleParams, {
    enabled: activeTab === "eligible",
  });

  const { data: catalogueModulesRes, isLoading: catalogueModulesLoading } =
    useGetFkfModules(
      {
        program: bulkProgram || undefined,
        batch: bulkBatch || undefined,
      },
      {
        enabled: Boolean(bulkProgram) && (bulkOpen || invoiceOpen),
      },
    );

  const {
    data: historyRes,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
    isFetching: historyFetching,
  } = useGetFkfInvoices(
    {
      page: historyPage,
      limit: historyRowsPerPage,
      ...(historyStatus !== "all" ? { status: historyStatus } : {}),
      ...(debouncedHistorySearch ? { search: debouncedHistorySearch } : {}),
      ...(historyProgram !== "all" ? { program: historyProgram } : {}),
      ...(historyBatch !== "all" ? { batch: historyBatch } : {}),
    },
    { enabled: activeTab === "history" },
  );

  const studentId = selectedStudent?._id || "";
  const { data: modulesRes, isLoading: modulesLoading } =
    useGetFkfStudentModules(studentId, {
      enabled: Boolean(studentId) && invoiceOpen,
      retry: false,
    });

  const { data: configRes } = useGetFkfConfig();
  const updateConfig = useUpdateFkfConfig();
  const createInvoice = useCreateFkfInvoice();
  const cancelInvoice = useCancelFkfInvoice();
  const createBulk = useCreateFkfBulkInvoices();
  const previewBulk = usePreviewFkfBulkInvoices();
  const markEligible = useMarkFkfEligible();
  const unmarkEligible = useUnmarkFkfEligible();
  const exportStudents = useExportFkfStudents();

  const studentsRows = studentsRes?.data?.rows || [];
  const studentsTotal = studentsRes?.data?.total || 0;
  const eligibleRows = eligibleRes?.data?.rows || [];
  const eligibleTotal = eligibleRes?.data?.total || 0;
  const historyRows = historyRes?.data?.rows || [];
  const historyTotal = historyRes?.data?.total || 0;

  const catalogueModules = (catalogueModulesRes?.data || []).map((m) => ({
    _id: m._id,
    name: `${m.name} (${m.type}) — ${m.currency || "EUR"} ${m.catalog_amount}`,
    catalog_amount: m.catalog_amount,
    currency: m.currency,
  }));

  const programSelectItems = useMemo(() => {
    const q = String(bulkProgramSearch || "").trim().toLowerCase();
    const mapped = programsList.map((p) => ({
      _id: p._id,
      name: programLabel(p),
    }));
    let list = q
      ? mapped.filter((p) => p.name.toLowerCase().includes(q))
      : mapped;
    if (bulkProgram) {
      const selected = mapped.find(
        (p) => String(p._id) === String(bulkProgram),
      );
      if (
        selected &&
        !list.some((p) => String(p._id) === String(bulkProgram))
      ) {
        list = [selected, ...list];
      }
    }
    return list;
  }, [programsList, bulkProgramSearch, bulkProgram]);

  const filterProgramItems = useMemo(() => {
    const allLabel = t("common.all", "All");
    const build = (search, selectedId) => {
      const q = String(search || "").trim().toLowerCase();
      const mapped = programsList.map((p) => ({
        _id: p._id,
        name: programLabel(p),
      }));
      let list = q
        ? mapped.filter((p) => p.name.toLowerCase().includes(q))
        : mapped;
      if (selectedId && selectedId !== "all") {
        const selected = mapped.find(
          (p) => String(p._id) === String(selectedId),
        );
        if (
          selected &&
          !list.some((p) => String(p._id) === String(selectedId))
        ) {
          list = [selected, ...list];
        }
      }
      return [{ _id: "all", name: allLabel }, ...list];
    };
    return {
      students: build(studentsProgramSearch, studentsProgram || "all"),
      eligible: build(eligibleProgramSearch, eligibleProgram || "all"),
      history: build(historyProgramSearch, historyProgram),
    };
  }, [
    t,
    programsList,
    studentsProgramSearch,
    studentsProgram,
    eligibleProgramSearch,
    eligibleProgram,
    historyProgramSearch,
    historyProgram,
  ]);

  const selectedBulkModule = useMemo(
    () =>
      catalogueModules.find((m) => String(m._id) === String(bulkModuleId)),
    [catalogueModules, bulkModuleId],
  );

  const modulePayload = modulesRes?.data;
  const studentModules = (modulePayload?.modules || []).map((m) => ({
    _id: m._id,
    name: `${m.name} (${m.type}) — ${m.currency || "EUR"} ${m.catalog_amount}${
      m.pending_fkf ? " · pending FKF" : ""
    }`,
    catalog_amount: m.catalog_amount,
    currency: m.currency,
    pending_fkf: m.pending_fkf,
  }));

  const selectedModule = useMemo(
    () => studentModules.find((m) => String(m._id) === String(componentId)),
    [studentModules, componentId],
  );

  useEffect(() => {
    const cfg = configRes?.data;
    if (!cfg) return;
    setPostalText((cfg.postal_codes || []).join(", "));
  }, [configRes]);

  useEffect(() => {
    setHistoryPage(1);
  }, [debouncedHistorySearch, historyStatus, historyProgram, historyBatch]);

  useEffect(() => {
    setStudentsPage(1);
    setStudentsSelectedIds([]);
  }, [debouncedStudentsSearch, studentsProgram, studentsBatch]);

  useEffect(() => {
    setStudentsBatch("");
  }, [studentsProgram]);

  useEffect(() => {
    setEligiblePage(1);
    setEligibleSelectedIds([]);
  }, [debouncedEligibleSearch, eligibleProgram, eligibleBatch]);

  useEffect(() => {
    setEligibleBatch("");
  }, [eligibleProgram]);

  useEffect(() => {
    setHistoryBatch("all");
  }, [historyProgram]);

  useEffect(() => {
    setComponentId("");
    setSubsidizedAmount("");
  }, [studentId, invoiceOpen]);

  useEffect(() => {
    if (selectedModule?.pending_fkf?.amount != null) {
      setSubsidizedAmount(String(selectedModule.pending_fkf.amount));
    }
  }, [selectedModule]);

  useEffect(() => {
    setBulkBatch("");
    setBulkModuleId("");
    setBulkStep("form");
    setBulkPreview(null);
  }, [bulkProgram]);

  useEffect(() => {
    setBulkStep("form");
    setBulkPreview(null);
  }, [bulkModuleId, bulkAmount, bulkBatch]);

  const toggleId = (setter) => (id, checked) => {
    setter((prev) => {
      const sid = String(id);
      if (checked) return prev.includes(sid) ? prev : [...prev, sid];
      return prev.filter((x) => x !== sid);
    });
  };

  const toggleSelectAll = (rows, setter) => (checked) => {
    if (!checked) {
      setter([]);
      return;
    }
    setter(rows.map((s) => String(s._id)));
  };

  const openSendInvoice = (student) => {
    setSelectedStudent(student);
    setInvoiceOpen(true);
  };

  const closeSendInvoice = () => {
    setInvoiceOpen(false);
    setSelectedStudent(null);
    setComponentId("");
    setSubsidizedAmount("");
  };

  const openBulkSend = () => {
    const selected = eligibleRows.filter((s) =>
      eligibleSelectedIds.includes(String(s._id)),
    );
    const first = selected[0];
    setBulkProgram(first?.program_id || eligibleProgram || "");
    setBulkBatch(first?.batch_id || eligibleBatch || "");
    setBulkModuleId("");
    setBulkAmount("");
    setBulkStep("form");
    setBulkPreview(null);
    setBulkOpen(true);
  };

  const closeBulkSend = () => {
    setBulkOpen(false);
    setBulkAmount("");
    setBulkModuleId("");
    setBulkStep("form");
    setBulkPreview(null);
  };

  const handleMarkEligible = () => {
    if (!studentsSelectedIds.length) return;
    markEligible.mutate(
      { user_ids: studentsSelectedIds },
      {
        onSuccess: () => {
          setStudentsSelectedIds([]);
          refetchStudents();
        },
      },
    );
  };

  const handleUnmarkEligible = () => {
    if (!eligibleSelectedIds.length) return;
    unmarkEligible.mutate(
      { user_ids: eligibleSelectedIds },
      {
        onSuccess: () => {
          setEligibleSelectedIds([]);
          refetchEligible();
        },
      },
    );
  };

  const handleExport = () => {
    exportStudents.mutate({
      apply_postal_filter: "true",
      ...(debouncedStudentsSearch ? { search: debouncedStudentsSearch } : {}),
      ...(studentsProgram ? { program: studentsProgram } : {}),
      ...(studentsBatch ? { batch: studentsBatch } : {}),
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!studentId || !componentId || !subsidizedAmount) return;
    createInvoice.mutate(
      {
        student_id: studentId,
        component_id: componentId,
        subsidized_amount: Number(subsidizedAmount),
        currency: selectedModule?.currency || "EUR",
      },
      {
        onSuccess: () => {
          closeSendInvoice();
          refetchEligible();
          setActiveTab("history");
          setHistoryPage(1);
        },
      },
    );
  };

  const handleBulkPreview = (e) => {
    e.preventDefault();
    if (
      !bulkProgram ||
      !bulkModuleId ||
      !bulkAmount ||
      eligibleSelectedIds.length === 0
    )
      return;
    previewBulk.mutate(
      {
        student_ids: eligibleSelectedIds,
        program_id: bulkProgram,
        component_id: bulkModuleId,
        subsidized_amount: Number(bulkAmount),
        currency: selectedBulkModule?.currency || "EUR",
      },
      {
        onSuccess: (res) => {
          setBulkPreview(res?.data || null);
          setBulkStep("preview");
        },
      },
    );
  };

  const handleBulkCreate = (e) => {
    e.preventDefault();
    if (
      !bulkProgram ||
      !bulkModuleId ||
      !bulkAmount ||
      eligibleSelectedIds.length === 0
    )
      return;
    const readyIds = (bulkPreview?.rows || [])
      .filter((r) => r.can_send)
      .map((r) => r.student_id);
    if (!readyIds.length) return;

    createBulk.mutate(
      {
        student_ids: readyIds,
        program_id: bulkProgram,
        component_id: bulkModuleId,
        subsidized_amount: Number(bulkAmount),
        currency: selectedBulkModule?.currency || "EUR",
      },
      {
        onSuccess: () => {
          closeBulkSend();
          setEligibleSelectedIds([]);
          refetchEligible();
          setActiveTab("history");
          setHistoryPage(1);
        },
      },
    );
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    const postal_codes = postalText
      .split(/[\s,;]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    updateConfig.mutate({
      postal_codes,
      program_active: true,
    });
  };

  const allStudentsChecked =
    studentsRows.length > 0 &&
    studentsRows.every((s) => studentsSelectedIds.includes(String(s._id)));

  const allEligibleChecked =
    eligibleRows.length > 0 &&
    eligibleRows.every((s) => eligibleSelectedIds.includes(String(s._id)));

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("finance.fkf.title", "Fachkursförderung")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            "finance.fkf.subtitle",
            "Postal students, mark eligible, send subsidized invoices, and manage config.",
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activeTab === "students" ? "default" : "outline"}
          onClick={() => setActiveTab("students")}
        >
          {t("finance.fkf.studentsListTab", "Students")}
        </Button>
        <Button
          type="button"
          variant={activeTab === "eligible" ? "default" : "outline"}
          onClick={() => setActiveTab("eligible")}
        >
          {t("finance.fkf.eligibleTab", "Eligible students")}
        </Button>
        <Button
          type="button"
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
        >
          {t("finance.fkf.historyTab", "Subsidy History")}
        </Button>
        <Button
          type="button"
          variant={activeTab === "config" ? "default" : "outline"}
          onClick={() => setActiveTab("config")}
        >
          {t("finance.fkf.configTab", "Config")}
        </Button>
      </div>

      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("common.search", "Search")}
              </Label>
              <Input
                className="w-56"
                placeholder={t(
                  "finance.fkf.searchStudents",
                  "Name, email, UID, postal…",
                )}
                value={studentsSearch}
                onChange={(e) => setStudentsSearch(e.target.value)}
              />
            </div>

            <div className="w-64">
              <SearchableSelect
                label={t("finance.fkf.program", "Program")}
                placeholder={t("common.all", "All")}
                searchPlaceholder={t(
                  "finance.fkf.searchProgram",
                  "Search programs…",
                )}
                items={filterProgramItems.students}
                value={studentsProgram || "all"}
                onChange={(v) => setStudentsProgram(v === "all" ? "" : v)}
                onSearch={setStudentsProgramSearch}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("finance.fkf.batch", "Batch")}
              </Label>
              <Select
                value={studentsBatch || "all"}
                onValueChange={(v) => setStudentsBatch(v === "all" ? "" : v)}
                disabled={!studentsProgram}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={t("common.all", "All")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                  {studentsBatchesList.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={exportStudents.isPending}
              >
                {exportStudents.isPending
                  ? t("common.exporting", "Exporting…")
                  : t("common.exportCsv", "Export CSV")}
              </Button>
              <Button
                type="button"
                onClick={handleMarkEligible}
                disabled={
                  !canModify ||
                  studentsSelectedIds.length === 0 ||
                  markEligible.isPending
                }
              >
                {t("finance.fkf.markEligible", "Mark as eligible")}
                {studentsSelectedIds.length > 0
                  ? ` (${studentsSelectedIds.length})`
                  : ""}
              </Button>
            </div>
          </div>

          <div className="bg-sidebar border border-sidebar-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allStudentsChecked}
                      onCheckedChange={(v) =>
                        toggleSelectAll(
                          studentsRows,
                          setStudentsSelectedIds,
                        )(Boolean(v))
                      }
                      disabled={studentsRows.length === 0}
                      aria-label={t("common.selectAll", "Select all")}
                    />
                  </TableHead>
                  <TableHead>{t("finance.fkf.student", "Student")}</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>{t("common.email", "Email")}</TableHead>
                  <TableHead>{t("finance.fkf.program", "Program")}</TableHead>
                  <TableHead>{t("finance.fkf.batch", "Batch")}</TableHead>
                  <TableHead>
                    {t("finance.fkf.postalCode", "Postal code")}
                  </TableHead>
                  <TableHead>{t("common.status", "Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                className={
                  studentsFetching ? "opacity-50 pointer-events-none" : ""
                }
              >
                {studentsLoading ? (
                  <TableSkeleton rows={8} columns={8} />
                ) : studentsError ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <ErrorMessage
                        message={
                          studentsError.message || "Failed to load students"
                        }
                        onRetry={refetchStudents}
                      />
                    </TableCell>
                  </TableRow>
                ) : studentsRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-10"
                    >
                      {t(
                        "finance.fkf.noPostalStudents",
                        "No students with a matching postal code found.",
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  studentsRows.map((student) => {
                    const checked = studentsSelectedIds.includes(
                      String(student._id),
                    );
                    return (
                      <TableRow key={student._id}>
                        <TableCell>
                          <Checkbox
                            checked={checked}
                            disabled={!canModify}
                            onCheckedChange={(v) =>
                              toggleId(setStudentsSelectedIds)(
                                student._id,
                                Boolean(v),
                              )
                            }
                            aria-label={studentName(student)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {studentName(student)}
                        </TableCell>
                        <TableCell>{student.uid || "-"}</TableCell>
                        <TableCell>{student.email || "-"}</TableCell>
                        <TableCell>{student.program || "-"}</TableCell>
                        <TableCell>{student.batch || "-"}</TableCell>
                        <TableCell>{student.postal_code || "-"}</TableCell>
                        <TableCell>
                          {student.fkf_admin_eligible ? (
                            <span className="text-sm text-emerald-700 dark:text-emerald-400">
                              {t("finance.fkf.markedEligible", "Eligible")}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {t("finance.fkf.notMarked", "Not marked")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={studentsPage}
            setPage={setStudentsPage}
            rowsPerPage={studentsRowsPerPage}
            setRowsPerPage={setStudentsRowsPerPage}
            totalRows={studentsTotal}
          />
        </div>
      )}

      {activeTab === "eligible" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("common.search", "Search")}
              </Label>
              <Input
                className="w-56"
                placeholder={t(
                  "finance.fkf.searchStudents",
                  "Name, email, UID, postal…",
                )}
                value={eligibleSearch}
                onChange={(e) => setEligibleSearch(e.target.value)}
              />
            </div>

            <div className="w-64">
              <SearchableSelect
                label={t("finance.fkf.program", "Program")}
                placeholder={t("common.all", "All")}
                searchPlaceholder={t(
                  "finance.fkf.searchProgram",
                  "Search programs…",
                )}
                items={filterProgramItems.eligible}
                value={eligibleProgram || "all"}
                onChange={(v) => setEligibleProgram(v === "all" ? "" : v)}
                onSearch={setEligibleProgramSearch}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("finance.fkf.batch", "Batch")}
              </Label>
              <Select
                value={eligibleBatch || "all"}
                onValueChange={(v) => setEligibleBatch(v === "all" ? "" : v)}
                disabled={!eligibleProgram}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={t("common.all", "All")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                  {eligibleBatchesList.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleUnmarkEligible}
                disabled={
                  !canModify ||
                  eligibleSelectedIds.length === 0 ||
                  unmarkEligible.isPending
                }
              >
                {t("finance.fkf.unmarkEligible", "Unmark")}
                {eligibleSelectedIds.length > 0
                  ? ` (${eligibleSelectedIds.length})`
                  : ""}
              </Button>
              <Button
                type="button"
                onClick={openBulkSend}
                disabled={
                  !canModify || eligibleSelectedIds.length === 0
                }
              >
                {t("finance.fkf.addModule", "Add module")}
                {eligibleSelectedIds.length > 0
                  ? ` (${eligibleSelectedIds.length})`
                  : ""}
              </Button>
            </div>
          </div>

          <div className="bg-sidebar border border-sidebar-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allEligibleChecked}
                      onCheckedChange={(v) =>
                        toggleSelectAll(
                          eligibleRows,
                          setEligibleSelectedIds,
                        )(Boolean(v))
                      }
                      disabled={eligibleRows.length === 0}
                      aria-label={t("common.selectAll", "Select all")}
                    />
                  </TableHead>
                  <TableHead>{t("finance.fkf.student", "Student")}</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>{t("common.email", "Email")}</TableHead>
                  <TableHead>{t("finance.fkf.program", "Program")}</TableHead>
                  <TableHead>{t("finance.fkf.batch", "Batch")}</TableHead>
                  <TableHead>
                    {t("finance.fkf.postalCode", "Postal code")}
                  </TableHead>
                  <TableHead className="w-12 text-right">
                    {t("common.actions", "Actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                className={
                  eligibleFetching ? "opacity-50 pointer-events-none" : ""
                }
              >
                {eligibleLoading ? (
                  <TableSkeleton rows={8} columns={8} />
                ) : eligibleError ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <ErrorMessage
                        message={
                          eligibleError.message ||
                          "Failed to load eligible students"
                        }
                        onRetry={refetchEligible}
                      />
                    </TableCell>
                  </TableRow>
                ) : eligibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-10"
                    >
                      {t(
                        "finance.fkf.noAdminEligible",
                        "No admin-marked eligible students yet. Mark students on the Students tab.",
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  eligibleRows.map((student) => {
                    const checked = eligibleSelectedIds.includes(
                      String(student._id),
                    );
                    return (
                      <TableRow key={student._id}>
                        <TableCell>
                          <Checkbox
                            checked={checked}
                            disabled={!canModify}
                            onCheckedChange={(v) =>
                              toggleId(setEligibleSelectedIds)(
                                student._id,
                                Boolean(v),
                              )
                            }
                            aria-label={studentName(student)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {studentName(student)}
                        </TableCell>
                        <TableCell>{student.uid || "-"}</TableCell>
                        <TableCell>{student.email || "-"}</TableCell>
                        <TableCell>{student.program || "-"}</TableCell>
                        <TableCell>{student.batch || "-"}</TableCell>
                        <TableCell>{student.postal_code || "-"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={!canModify}
                                onClick={() => openSendInvoice(student)}
                              >
                                {t(
                                  "finance.fkf.sendInvoice",
                                  "Send FKF Invoice",
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={eligiblePage}
            setPage={setEligiblePage}
            rowsPerPage={eligibleRowsPerPage}
            setRowsPerPage={setEligibleRowsPerPage}
            totalRows={eligibleTotal}
          />
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("common.search", "Search")}
              </Label>
              <Input
                className="w-56"
                placeholder={t(
                  "finance.fkf.searchHistory",
                  "Search student name, email, UID…",
                )}
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("common.status", "Status")}
              </Label>
              <Select
                value={historyStatus}
                onValueChange={(v) => {
                  setHistoryStatus(v);
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.all", "All")}
                  </SelectItem>
                  <SelectItem value="pending">
                    {t("common.pending", "Pending")}
                  </SelectItem>
                  <SelectItem value="paid">
                    {t("common.paid", "Paid")}
                  </SelectItem>
                  <SelectItem value="failed">
                    {t("common.failed", "Failed")}
                  </SelectItem>
                  <SelectItem value="canceled">
                    {t("common.canceled", "Canceled")}
                  </SelectItem>
                  <SelectItem value="used_via_kmo">
                    {t("finance.fkf.usedViaKmo", "Used via KMO")}
                  </SelectItem>
                  <SelectItem value="used_via_location_switch">
                    {t(
                      "finance.fkf.usedViaLocationSwitch",
                      "Used via location switch",
                    )}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-64">
              <SearchableSelect
                label={t("finance.fkf.program", "Program")}
                placeholder={t("common.all", "All")}
                searchPlaceholder={t(
                  "finance.fkf.searchProgram",
                  "Search programs…",
                )}
                items={filterProgramItems.history}
                value={historyProgram}
                onChange={(v) => {
                  setHistoryProgram(v || "all");
                  setHistoryPage(1);
                }}
                onSearch={setHistoryProgramSearch}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("finance.fkf.batch", "Batch")}
              </Label>
              <Select
                value={historyBatch}
                onValueChange={(v) => {
                  setHistoryBatch(v);
                  setHistoryPage(1);
                }}
                disabled={historyProgram === "all"}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.all", "All")}
                  </SelectItem>
                  {historyBatchesList.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-sidebar border border-sidebar-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("finance.fkf.student", "Student")}</TableHead>
                  <TableHead>{t("finance.fkf.module", "Module")}</TableHead>
                  <TableHead>
                    {t("finance.fkf.subsidizedAmount", "Subsidized")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.catalogFee", "Catalog fee")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.invoice", "Invoice")}
                  </TableHead>
                  <TableHead>{t("common.status", "Status")}</TableHead>
                  <TableHead>
                    {t("finance.fkf.sentAt", "Sent")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.paidAt", "Paid")}
                  </TableHead>
                  {canModify ? (
                    <TableHead className="w-12 text-right">
                      {t("common.actions", "Actions")}
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody
                className={
                  historyFetching ? "opacity-50 pointer-events-none" : ""
                }
              >
                {historyLoading ? (
                  <TableSkeleton
                    rows={historyRowsPerPage}
                    columns={canModify ? 9 : 8}
                  />
                ) : historyError ? (
                  <TableRow>
                    <TableCell colSpan={canModify ? 9 : 8}>
                      <ErrorMessage
                        message={
                          historyError.message || "Failed to load FKF history"
                        }
                        onRetry={refetchHistory}
                      />
                    </TableCell>
                  </TableRow>
                ) : historyRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canModify ? 9 : 8}
                      className="text-center text-muted-foreground py-10"
                    >
                      {t(
                        "finance.fkf.noHistory",
                        "No FKF invoices sent yet.",
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  historyRows.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>
                        <div className="font-medium">
                          {row.student?.name ||
                            studentName(row.student || {})}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.student?.uid || row.student?.email || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.module?.name || "-"}
                        {row.module?.uid ? (
                          <div className="text-xs text-muted-foreground">
                            {row.module.uid}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(row.currency, row.subsidized_amount)}
                      </TableCell>
                      <TableCell>
                        {formatMoney(row.currency, row.catalog_amount)}
                      </TableCell>
                      <TableCell>
                        {row.invoice?.uid || row.payment_uid || "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.payment_status} />
                      </TableCell>
                      <TableCell>
                        {row.created_at
                          ? moment(row.created_at).format("DD MMM YYYY")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {row.paid_at
                          ? moment(row.paid_at).format("DD MMM YYYY")
                          : "-"}
                      </TableCell>
                      {canModify ? (
                        <TableCell className="text-right">
                          {row.payment_status === "pending" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={t("common.actions", "Actions")}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setCancelTarget(row)}
                                >
                                  {t(
                                    "finance.fkf.cancelSubsidy",
                                    "Cancel subsidy",
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={historyPage}
            setPage={setHistoryPage}
            rowsPerPage={historyRowsPerPage}
            setRowsPerPage={setHistoryRowsPerPage}
            totalRows={historyTotal}
          />
        </div>
      )}

      {activeTab === "config" && (
        <form
          onSubmit={handleSaveConfig}
          className="bg-sidebar border border-sidebar-border rounded-xl p-6 space-y-6 max-w-2xl"
        >
          <div className="space-y-2">
            <Label htmlFor="fkf-postal-codes">
              {t("finance.fkf.postalCodes", "Eligible postal codes")}
            </Label>
            <Textarea
              id="fkf-postal-codes"
              className="min-h-[120px]"
              value={postalText}
              onChange={(e) => setPostalText(e.target.value)}
              placeholder={t(
                "finance.fkf.postalCodesPlaceholder",
                "e.g. 70173, 76133, 89073",
              )}
              disabled={!canModify}
            />
            <p className="text-xs text-muted-foreground">
              {t(
                "finance.fkf.postalCodesHint",
                "Separate codes with commas or new lines. Students with these postal codes appear on the Students tab.",
              )}
            </p>
          </div>

          <Button type="submit" disabled={updateConfig.isPending || !canModify}>
            {updateConfig.isPending
              ? t("common.saving", "Saving…")
              : t("common.save", "Save")}
          </Button>
        </form>
      )}

      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open && !cancelInvoice.isPending) setCancelTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("finance.fkf.cancelSubsidyTitle", "Cancel FKF subsidy?")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t(
              "finance.fkf.cancelSubsidyConfirm",
              "This voids the unpaid subsidy invoice. The student will no longer see this offer. Paid subsidies cannot be cancelled.",
            )}
          </p>
          {cancelTarget ? (
            <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">
                  {t("finance.fkf.student", "Student")}:{" "}
                </span>
                <strong>
                  {cancelTarget.student?.name ||
                    studentName(cancelTarget.student || {})}
                </strong>
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t("finance.fkf.module", "Module")}:{" "}
                </span>
                <strong>{cancelTarget.module?.name || "-"}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t("finance.fkf.invoice", "Invoice")}:{" "}
                </span>
                <strong>
                  {cancelTarget.invoice?.uid ||
                    cancelTarget.payment_uid ||
                    "-"}
                </strong>
              </p>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={cancelInvoice.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={cancelInvoice.isPending || !cancelTarget?._id}
              onClick={async () => {
                if (!cancelTarget?._id) return;
                try {
                  await cancelInvoice.mutateAsync(cancelTarget._id);
                  setCancelTarget(null);
                } catch {
                  // toast handled by mutation
                }
              }}
            >
              {cancelInvoice.isPending
                ? t("finance.fkf.cancelling", "Cancelling…")
                : t("finance.fkf.cancelSubsidy", "Cancel subsidy")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={invoiceOpen}
        onOpenChange={(open) => {
          if (!open) closeSendInvoice();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("finance.fkf.sendInvoice", "Send FKF Invoice")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
              <p className="font-medium">
                {selectedStudent ? studentName(selectedStudent) : ""}
                {selectedStudent?.uid ? ` (${selectedStudent.uid})` : ""}
              </p>
              <p className="text-muted-foreground">
                {selectedStudent?.postal_code
                  ? `PLZ ${selectedStudent.postal_code}`
                  : ""}
              </p>
            </div>

            <SearchableSelect
              label={t("finance.fkf.module", "Module / Exam")}
              placeholder={t("finance.fkf.selectModule", "Select module…")}
              searchPlaceholder={t("common.search", "Search")}
              items={studentModules}
              value={componentId}
              onChange={setComponentId}
              isLoading={modulesLoading}
              required
            />

            {selectedModule && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <p>
                  {t("finance.fkf.catalogFee", "Catalog fee")}:{" "}
                  <strong>
                    {selectedModule.currency || "EUR"}{" "}
                    {selectedModule.catalog_amount}
                  </strong>
                </p>
                {selectedModule.pending_fkf && (
                  <p className="text-amber-700 dark:text-amber-400">
                    {t(
                      "finance.fkf.pendingHint",
                      "A pending FKF payment already exists for this module.",
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>
                {t("finance.fkf.subsidizedAmount", "Subsidized amount")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={subsidizedAmount}
                onChange={(e) => setSubsidizedAmount(e.target.value)}
                placeholder="e.g. 600"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeSendInvoice}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  createInvoice.isPending ||
                  !componentId ||
                  !subsidizedAmount ||
                  !canModify
                }
              >
                {createInvoice.isPending
                  ? t("common.processing", "Processing…")
                  : t("finance.fkf.createButton", "Create FKF Invoice")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkOpen}
        onOpenChange={(open) => {
          if (!open) closeBulkSend();
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bulkStep === "preview"
                ? t("finance.fkf.previewInvoices", "Preview invoices")
                : t("finance.fkf.addModule", "Add module")}
            </DialogTitle>
          </DialogHeader>

          {bulkStep === "form" ? (
            <form onSubmit={handleBulkPreview} className="space-y-4">
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <p className="font-medium">
                  {t("finance.fkf.bulkSelectedCount", {
                    count: eligibleSelectedIds.length,
                    defaultValue: `${eligibleSelectedIds.length} students selected`,
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    "finance.fkf.bulkPreviewHint",
                    "Choose programme and module, then preview before sending.",
                  )}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <SearchableSelect
                    label={t("finance.fkf.program", "Program")}
                    placeholder={t(
                      "finance.fkf.selectProgram",
                      "Select program…",
                    )}
                    searchPlaceholder={t(
                      "finance.fkf.searchProgram",
                      "Search programs…",
                    )}
                    items={programSelectItems}
                    value={bulkProgram}
                    onChange={setBulkProgram}
                    onSearch={setBulkProgramSearch}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("finance.fkf.batch", "Batch")}
                  </Label>
                  <Select
                    value={bulkBatch || "all"}
                    onValueChange={(v) => setBulkBatch(v === "all" ? "" : v)}
                    disabled={!bulkProgram}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("common.all", "All")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("common.all", "All")}
                      </SelectItem>
                      {bulkBatchesList.map((b) => (
                        <SelectItem key={b._id} value={b._id} title={b.name}>
                          <span className="block truncate">{b.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("finance.fkf.subsidizedAmount", "Subsidized amount")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(e.target.value)}
                    placeholder="e.g. 600"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <SearchableSelect
                    label={t("finance.fkf.module", "Module / Exam")}
                    placeholder={t(
                      "finance.fkf.selectModule",
                      "Select module…",
                    )}
                    searchPlaceholder={t("common.search", "Search")}
                    items={catalogueModules}
                    value={bulkModuleId}
                    onChange={setBulkModuleId}
                    isLoading={catalogueModulesLoading}
                    disabled={!bulkProgram}
                    required
                  />
                </div>
              </div>

              {selectedBulkModule && (
                <p className="text-sm text-muted-foreground">
                  {t("finance.fkf.catalogFee", "Catalog fee")}:{" "}
                  <strong>
                    {formatMoney(
                      selectedBulkModule.currency,
                      selectedBulkModule.catalog_amount,
                    )}
                  </strong>
                  <span className="block text-xs mt-1">
                    {t(
                      "finance.fkf.bulkAmountHint",
                      "Subsidized amount is applied to every student. Catalog may differ after location change.",
                    )}
                  </span>
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeBulkSend}>
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    previewBulk.isPending ||
                    !bulkProgram ||
                    !bulkModuleId ||
                    !bulkAmount ||
                    eligibleSelectedIds.length === 0 ||
                    !canModify
                  }
                >
                  {previewBulk.isPending
                    ? t("common.processing", "Processing…")
                    : t("finance.fkf.previewButton", "Preview")}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div className="rounded-lg bg-muted/40 p-3 text-sm flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  {t("finance.fkf.readyCount", "Ready")}:{" "}
                  <strong>{bulkPreview?.ready_count ?? 0}</strong>
                </span>
                <span>
                  {t("finance.fkf.blockedCount", "Blocked")}:{" "}
                  <strong>{bulkPreview?.blocked_count ?? 0}</strong>
                </span>
                <span>
                  {t("finance.fkf.subsidizedAmount", "Subsidized")}:{" "}
                  <strong>
                    {formatMoney(
                      bulkPreview?.currency,
                      bulkPreview?.subsidized_amount,
                    )}
                  </strong>
                </span>
              </div>

              <div className="border border-sidebar-border rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("finance.fkf.student", "Student")}
                      </TableHead>
                      <TableHead>
                        {t("finance.fkf.module", "Module")}
                      </TableHead>
                      <TableHead>
                        {t("finance.fkf.catalogFee", "Catalog")}
                      </TableHead>
                      <TableHead>
                        {t("finance.fkf.subsidizedAmount", "Subsidy")}
                      </TableHead>
                      <TableHead>{t("common.status", "Status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(bulkPreview?.rows || []).map((row) => (
                      <TableRow key={row.student_id}>
                        <TableCell>
                          <div className="font-medium">
                            {studentName(row)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.uid || row.email || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.can_send ? (
                            <div>
                              <div className="text-sm">
                                {row.component_name || "-"}
                              </div>
                              {row.location_changed ? (
                                <div className="text-xs text-amber-700 dark:text-amber-400">
                                  {t(
                                    "finance.fkf.locationChanged",
                                    "Location changed",
                                  )}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {row.can_send
                            ? formatMoney(row.currency, row.catalog_amount)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {formatMoney(row.currency, row.subsidized_amount)}
                        </TableCell>
                        <TableCell>
                          {row.can_send ? (
                            <span className="text-sm text-emerald-700 dark:text-emerald-400">
                              {t("finance.fkf.readyToSend", "Ready")}
                            </span>
                          ) : (
                            <span className="text-sm text-destructive">
                              {row.error || t("common.error", "Error")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setBulkStep("form");
                    setBulkPreview(null);
                  }}
                >
                  {t("common.back", "Back")}
                </Button>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={closeBulkSend}
                  >
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={
                      createBulk.isPending ||
                      !bulkPreview?.ready_count ||
                      !canModify
                    }
                  >
                    {createBulk.isPending
                      ? t("common.processing", "Processing…")
                      : t("finance.fkf.bulkSendConfirm", {
                          count: bulkPreview?.ready_count || 0,
                          defaultValue: `Send ${bulkPreview?.ready_count || 0} invoices`,
                        })}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FkfManagement;
