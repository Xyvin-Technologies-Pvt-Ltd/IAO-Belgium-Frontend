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
  useCreateFkfBulkInvoices,
  useCreateFkfInvoice,
  useGetFkfBulkPreview,
  useGetFkfConfig,
  useGetFkfInvoices,
  useGetFkfModules,
  useGetFkfStudentModules,
  useUpdateFkfConfig,
} from "@/store/useFkfStore";
import { useCanModify } from "@/hooks/useCanModify";

const FkfManagement = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("finance");
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [batch, setBatch] = useState("");
  const [catalogueModuleId, setCatalogueModuleId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("all");
  const [historyProgram, setHistoryProgram] = useState("all");
  const [historyBatch, setHistoryBatch] = useState("all");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [componentId, setComponentId] = useState("");
  const [subsidizedAmount, setSubsidizedAmount] = useState("");
  const [bulkAmount, setBulkAmount] = useState("");
  const [postalText, setPostalText] = useState("");

  const debouncedSearch = useDebounce(search, 400);
  const debouncedHistorySearch = useDebounce(historySearch, 400);

  const { data: programsData } = useGetAllPrograms();
  const selectedProgramId = program || null;
  const { data: batchesData } = useGetBatches(
    selectedProgramId,
    {},
    { enabled: Boolean(selectedProgramId) },
  );
  const historyProgramId = historyProgram !== "all" ? historyProgram : null;
  const { data: historyBatchesData } = useGetBatches(
    historyProgramId,
    {},
    { enabled: Boolean(historyProgramId) },
  );

  const {
    data: catalogueModulesRes,
    isLoading: catalogueModulesLoading,
  } = useGetFkfModules(
    {
      program: program || undefined,
      batch: batch || undefined,
    },
    { enabled: Boolean(program && batch) },
  );

  const {
    data: previewRes,
    isLoading: previewLoading,
    error: previewError,
    refetch: refetchPreview,
    isFetching: previewFetching,
  } = useGetFkfBulkPreview(
    {
      batch: batch || undefined,
      component: catalogueModuleId || undefined,
    },
    {
      enabled: Boolean(program && batch && catalogueModuleId),
      retry: false,
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
  const createBulk = useCreateFkfBulkInvoices();

  const historyRows = historyRes?.data?.rows || [];
  const historyTotal = historyRes?.data?.total || 0;
  const programsList = programsData?.data || [];
  const batchesList = batchesData?.data || [];
  const historyBatchesList = historyBatchesData?.data || [];

  const catalogueModules = (catalogueModulesRes?.data || []).map((m) => ({
    _id: m._id,
    name: `${m.name} (${m.type}) — ${m.currency || "EUR"} ${m.catalog_amount}`,
    catalog_amount: m.catalog_amount,
    currency: m.currency,
  }));

  const selectedCatalogueModule = useMemo(
    () =>
      catalogueModules.find(
        (m) => String(m._id) === String(catalogueModuleId),
      ),
    [catalogueModules, catalogueModuleId],
  );

  const previewStudents = previewRes?.data?.students || [];
  const filteredStudents = useMemo(() => {
    const q = String(debouncedSearch || "").trim().toLowerCase();
    if (!q) return previewStudents;
    return previewStudents.filter((s) => {
      const hay = [
        s.first_name,
        s.last_name,
        s.email,
        s.uid,
        s.postal_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [previewStudents, debouncedSearch]);

  const selectableStudents = useMemo(
    () => filteredStudents.filter((s) => s.can_send),
    [filteredStudents],
  );

  const modulePayload = modulesRes?.data;
  const modules = (modulePayload?.modules || []).map((m) => ({
    _id: m._id,
    name: `${m.name} (${m.type}) — ${m.currency || "EUR"} ${m.catalog_amount}${
      m.pending_fkf ? " · pending FKF" : ""
    }`,
    catalog_amount: m.catalog_amount,
    currency: m.currency,
    pending_fkf: m.pending_fkf,
  }));

  const selectedModule = useMemo(
    () => modules.find((m) => String(m._id) === String(componentId)),
    [modules, componentId],
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
    setBatch("");
    setCatalogueModuleId("");
    setSelectedStudentIds([]);
  }, [program]);

  useEffect(() => {
    setCatalogueModuleId("");
    setSelectedStudentIds([]);
  }, [batch]);

  useEffect(() => {
    setSelectedStudentIds([]);
  }, [catalogueModuleId, debouncedSearch]);

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
    } else if (
      invoiceOpen &&
      selectedCatalogueModule &&
      !subsidizedAmount &&
      String(componentId) === String(catalogueModuleId)
    ) {
      // leave empty for admin to enter
    }
  }, [selectedModule]);

  const openSendInvoice = (student) => {
    setSelectedStudent(student);
    setInvoiceOpen(true);
    if (catalogueModuleId) {
      setComponentId(catalogueModuleId);
    }
  };

  const closeSendInvoice = () => {
    setInvoiceOpen(false);
    setSelectedStudent(null);
    setComponentId("");
    setSubsidizedAmount("");
  };

  const openBulkSend = () => {
    setBulkAmount("");
    setBulkOpen(true);
  };

  const closeBulkSend = () => {
    setBulkOpen(false);
    setBulkAmount("");
  };

  const toggleStudent = (id, checked) => {
    setSelectedStudentIds((prev) => {
      const sid = String(id);
      if (checked) {
        return prev.includes(sid) ? prev : [...prev, sid];
      }
      return prev.filter((x) => x !== sid);
    });
  };

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedStudentIds([]);
      return;
    }
    setSelectedStudentIds(selectableStudents.map((s) => String(s._id)));
  };

  const allSelectableChecked =
    selectableStudents.length > 0 &&
    selectableStudents.every((s) =>
      selectedStudentIds.includes(String(s._id)),
    );

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
          refetchPreview();
          setActiveTab("history");
          setHistoryPage(1);
        },
      },
    );
  };

  const handleBulkCreate = (e) => {
    e.preventDefault();
    if (!catalogueModuleId || !bulkAmount || selectedStudentIds.length === 0)
      return;
    createBulk.mutate(
      {
        student_ids: selectedStudentIds,
        component_id: catalogueModuleId,
        subsidized_amount: Number(bulkAmount),
        currency: selectedCatalogueModule?.currency || "EUR",
      },
      {
        onSuccess: () => {
          closeBulkSend();
          setSelectedStudentIds([]);
          refetchPreview();
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

  const studentName = (s) =>
    `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email || "-";

  const formatMoney = (currency, amount) => {
    if (amount == null || amount === "") return "-";
    const symbol = currency === "EUR" ? "€" : currency || "EUR";
    return `${symbol} ${Number(amount).toFixed(2)}`;
  };

  const filtersReady = Boolean(program && batch);
  const previewReady = Boolean(filtersReady && catalogueModuleId);

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("finance.fkf.title", "Fachkursförderung")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            "finance.fkf.subtitle",
            "Eligible students, subsidized invoices, and postal eligibility config.",
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activeTab === "students" ? "default" : "outline"}
          onClick={() => setActiveTab("students")}
        >
          {t("finance.fkf.studentsTab", "Eligible Students")}
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
                {t("finance.fkf.program", "Program")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={program || undefined}
                onValueChange={(v) => setProgram(v)}
              >
                <SelectTrigger className="w-56">
                  <SelectValue
                    placeholder={t(
                      "finance.fkf.selectProgram",
                      "Select program…",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {programsList.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {`${p.name} - ${p.language?.name || ""} - ${p.city?.name || ""}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("finance.fkf.batch", "Batch")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={batch || undefined}
                onValueChange={(v) => setBatch(v)}
                disabled={!program}
              >
                <SelectTrigger className="w-48">
                  <SelectValue
                    placeholder={
                      !program
                        ? t(
                            "finance.fkf.selectProgramFirst",
                            "Select program first",
                          )
                        : t("finance.fkf.selectBatch", "Select batch…")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {batchesList.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[260px]">
              <Label className="text-xs text-muted-foreground">
                {t("finance.fkf.module", "Module / Exam")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                placeholder={
                  !filtersReady
                    ? t(
                        "finance.fkf.selectProgramBatchFirst",
                        "Select program and batch first",
                      )
                    : t("finance.fkf.selectModule", "Select module…")
                }
                searchPlaceholder={t("common.search", "Search")}
                items={catalogueModules}
                value={catalogueModuleId}
                onChange={setCatalogueModuleId}
                isLoading={catalogueModulesLoading}
                disabled={!filtersReady}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("common.search", "Search")}
              </Label>
              <Input
                className="w-56"
                placeholder={t(
                  "finance.fkf.searchStudent",
                  "Search student…",
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!previewReady}
              />
            </div>

            <Button
              type="button"
              disabled={
                !canModify ||
                !previewReady ||
                selectedStudentIds.length === 0
              }
              onClick={openBulkSend}
            >
              {t("finance.fkf.bulkSend", "Bulk Send Invoice")}
              {selectedStudentIds.length > 0
                ? ` (${selectedStudentIds.length})`
                : ""}
            </Button>
          </div>

          {selectedCatalogueModule && previewReady && (
            <p className="text-sm text-muted-foreground">
              {t("finance.fkf.catalogFee", "Catalog fee")}:{" "}
              <strong>
                {formatMoney(
                  selectedCatalogueModule.currency,
                  selectedCatalogueModule.catalog_amount,
                )}
              </strong>
            </p>
          )}

          <div className="bg-sidebar border border-sidebar-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelectableChecked}
                      onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
                      disabled={
                        !previewReady || selectableStudents.length === 0
                      }
                      aria-label={t("common.selectAll", "Select all")}
                    />
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.student", "Student")}
                  </TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>
                    {t("finance.fkf.postalCode", "Postal code")}
                  </TableHead>
                  <TableHead>
                    {t("common.status", "Status")}
                  </TableHead>
                  <TableHead className="w-12 text-right">
                    {t("common.actions", "Actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                className={
                  previewFetching ? "opacity-50 pointer-events-none" : ""
                }
              >
                {!previewReady ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-10"
                    >
                      {t(
                        "finance.fkf.selectProgramBatchModule",
                        "Select program, batch, and module to load eligible students.",
                      )}
                    </TableCell>
                  </TableRow>
                ) : previewLoading ? (
                  <TableSkeleton rows={8} columns={6} />
                ) : previewError ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <ErrorMessage
                        message={
                          previewError.message ||
                          "Failed to load students for this module"
                        }
                        onRetry={refetchPreview}
                      />
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-10"
                    >
                      {t(
                        "finance.fkf.noEligibleStudents",
                        "No eligible students found.",
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const checked = selectedStudentIds.includes(
                      String(student._id),
                    );
                    let statusLabel = t(
                      "finance.fkf.readyToSend",
                      "Ready to send",
                    );
                    if (student.already_paid) {
                      statusLabel = t("common.paid", "Paid");
                    } else if (!student.eligible) {
                      statusLabel = t(
                        "finance.fkf.notEligible",
                        "Not eligible",
                      );
                    } else if (student.pending_fkf) {
                      statusLabel = t(
                        "finance.fkf.pendingOffer",
                        "Pending FKF offer",
                      );
                    }

                    return (
                      <TableRow key={student._id}>
                        <TableCell>
                          <Checkbox
                            checked={checked}
                            disabled={!student.can_send || !canModify}
                            onCheckedChange={(v) =>
                              toggleStudent(student._id, Boolean(v))
                            }
                            aria-label={studentName(student)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {studentName(student)}
                        </TableCell>
                        <TableCell>{student.uid || "-"}</TableCell>
                        <TableCell>{student.postal_code || "-"}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {statusLabel}
                            {student.pending_fkf?.amount != null
                              ? ` · ${formatMoney(
                                  selectedCatalogueModule?.currency,
                                  student.pending_fkf.amount,
                                )}`
                              : ""}
                          </span>
                        </TableCell>
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
                                disabled={!canModify || !student.can_send}
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("finance.fkf.program", "Program")}
              </Label>
              <Select
                value={historyProgram}
                onValueChange={(v) => {
                  setHistoryProgram(v);
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.all", "All")}
                  </SelectItem>
                  {programsList.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {`${p.name} - ${p.language?.name || ""} - ${p.city?.name || ""}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <SelectTrigger className="w-48">
                  <SelectValue
                    placeholder={
                      historyProgram === "all"
                        ? t(
                            "finance.fkf.selectProgramFirst",
                            "Select program first",
                          )
                        : t("common.all", "All")
                    }
                  />
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
                  <TableHead>
                    {t("finance.fkf.student", "Student")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.module", "Module / Exam")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.subsidizedAmount", "Subsidized amount")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.catalogFee", "Catalog fee")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.invoiceNumber", "Invoice #")}
                  </TableHead>
                  <TableHead>
                    {t("common.status", "Status")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.sentDate", "Sent")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.paidDate", "Paid")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                className={
                  historyFetching ? "opacity-50 pointer-events-none" : ""
                }
              >
                {historyLoading ? (
                  <TableSkeleton rows={historyRowsPerPage} columns={8} />
                ) : historyError ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <ErrorMessage
                        message={
                          historyError.message ||
                          "Failed to load FKF history"
                        }
                        onRetry={refetchHistory}
                      />
                    </TableCell>
                  </TableRow>
                ) : historyRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
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
                "Separate codes with commas or new lines. Students with a matching postal code are eligible for Fachkursförderung.",
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
                {[
                  previewRes?.data?.program?.name,
                  previewRes?.data?.batch?.name,
                  selectedStudent?.postal_code
                    ? `PLZ ${selectedStudent.postal_code}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <SearchableSelect
              label={t("finance.fkf.module", "Module / Exam")}
              placeholder={t("finance.fkf.selectModule", "Select module…")}
              searchPlaceholder={t("common.search", "Search")}
              items={modules}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("finance.fkf.bulkSend", "Bulk Send Invoice")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBulkCreate} className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
              <p className="font-medium">
                {selectedCatalogueModule?.name ||
                  previewRes?.data?.module?.name ||
                  "-"}
              </p>
              <p className="text-muted-foreground">
                {t("finance.fkf.bulkSelectedCount", {
                  count: selectedStudentIds.length,
                  defaultValue: `${selectedStudentIds.length} students selected`,
                })}
              </p>
              {selectedCatalogueModule && (
                <p className="text-muted-foreground">
                  {t("finance.fkf.catalogFee", "Catalog fee")}:{" "}
                  {formatMoney(
                    selectedCatalogueModule.currency,
                    selectedCatalogueModule.catalog_amount,
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
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
              <p className="text-xs text-muted-foreground">
                {t(
                  "finance.fkf.bulkAmountHint",
                  "This subsidized amount will be applied to every selected student.",
                )}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeBulkSend}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  createBulk.isPending ||
                  !bulkAmount ||
                  selectedStudentIds.length === 0 ||
                  !canModify
                }
              >
                {createBulk.isPending
                  ? t("common.processing", "Processing…")
                  : t("finance.fkf.bulkSendConfirm", "Send invoices")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FkfManagement;
