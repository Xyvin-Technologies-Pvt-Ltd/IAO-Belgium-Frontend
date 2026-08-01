import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useGetStudents } from "@/store/useStudentStore";
import {
  useGetAllAcademicYears,
  useGetAllPrograms,
  useGetBatches,
} from "@/store/useDropdownStore";
import {
  useCreateFkfInvoice,
  useGetFkfConfig,
  useGetFkfStudentModules,
  useUpdateFkfConfig,
} from "@/store/useFkfStore";
import { useCanModify } from "@/hooks/useCanModify";

const FkfManagement = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("finance");
  const [activeTab, setActiveTab] = useState("students");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [batch, setBatch] = useState("all");
  const [academic, setAcademic] = useState("all");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [componentId, setComponentId] = useState("");
  const [subsidizedAmount, setSubsidizedAmount] = useState("");
  const [postalText, setPostalText] = useState("");
  const [programActive, setProgramActive] = useState(true);

  const debouncedSearch = useDebounce(search, 400);

  const { data: programsData } = useGetAllPrograms();
  const { data: academicData } = useGetAllAcademicYears();
  const selectedProgramId = program !== "all" ? program : null;
  const { data: batchesData } = useGetBatches(
    selectedProgramId,
    {},
    { enabled: Boolean(selectedProgramId) },
  );

  const { data, isLoading, error, refetch, isFetching } = useGetStudents({
    page,
    limit: rowsPerPage,
    fachkursfoerderung: true,
    status: "active",
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(program !== "all" ? { program } : {}),
    ...(batch !== "all" ? { batch } : {}),
    ...(academic !== "all" ? { academic } : {}),
  });

  const studentId = selectedStudent?._id || "";
  const { data: modulesRes, isLoading: modulesLoading } =
    useGetFkfStudentModules(studentId, {
      enabled: Boolean(studentId) && invoiceOpen,
      retry: false,
    });

  const { data: configRes } = useGetFkfConfig();
  const updateConfig = useUpdateFkfConfig();
  const createInvoice = useCreateFkfInvoice();

  const students = data?.data || [];
  const totalRows = data?.total_count || 0;
  const programsList = programsData?.data || [];
  const batchesList = batchesData?.data || [];
  const academicList = academicData?.data || [];

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
    setProgramActive(Boolean(cfg.program_active));
  }, [configRes]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, program, batch, academic]);

  useEffect(() => {
    setBatch("all");
  }, [program]);

  useEffect(() => {
    setComponentId("");
    setSubsidizedAmount("");
  }, [studentId, invoiceOpen]);

  useEffect(() => {
    if (selectedModule?.pending_fkf?.amount != null) {
      setSubsidizedAmount(String(selectedModule.pending_fkf.amount));
    }
  }, [selectedModule]);

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
          refetch();
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
      program_active: programActive,
    });
  };

  const studentName = (s) =>
    `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email || "-";

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

      <div className="flex gap-2">
        <Button
          type="button"
          variant={activeTab === "students" ? "default" : "outline"}
          onClick={() => setActiveTab("students")}
        >
          {t("finance.fkf.studentsTab", "Eligible Students")}
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
                  "finance.fkf.searchStudent",
                  "Search student…",
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("finance.fkf.academicYear", "Academic year")}
              </Label>
              <Select
                value={academic}
                onValueChange={(v) => {
                  setAcademic(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.all", "All")}
                  </SelectItem>
                  {academicList.map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t("finance.fkf.program", "Program")}
              </Label>
              <Select
                value={program}
                onValueChange={(v) => {
                  setProgram(v);
                  setPage(1);
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
                      {p.name}
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
                value={batch}
                onValueChange={(v) => {
                  setBatch(v);
                  setPage(1);
                }}
                disabled={program === "all"}
              >
                <SelectTrigger className="w-48">
                  <SelectValue
                    placeholder={
                      program === "all"
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
                  {batchesList.map((b) => (
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
                  <TableHead>UID</TableHead>
                  <TableHead>
                    {t("finance.fkf.postalCode", "Postal code")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.program", "Program")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.batch", "Batch")}
                  </TableHead>
                  <TableHead>
                    {t("finance.fkf.academicYear", "Academic year")}
                  </TableHead>
                  <TableHead className="w-12 text-right">
                    {t("common.actions", "Actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                className={isFetching ? "opacity-50 pointer-events-none" : ""}
              >
                {isLoading ? (
                  <TableSkeleton rows={rowsPerPage} columns={7} />
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <ErrorMessage
                        message={error.message || "Failed to load students"}
                        onRetry={refetch}
                      />
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-10"
                    >
                      {t(
                        "finance.fkf.noEligibleStudents",
                        "No eligible students found.",
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">
                        {studentName(student)}
                      </TableCell>
                      <TableCell>{student.uid || "-"}</TableCell>
                      <TableCell>{student.postal_code || "-"}</TableCell>
                      <TableCell>{student.program_name || "-"}</TableCell>
                      <TableCell>{student.batch_name || "-"}</TableCell>
                      <TableCell>{student.academic_name || "-"}</TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            setPage={setPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            totalRows={totalRows}
          />
        </div>
      )}

      {activeTab === "config" && (
        <form
          onSubmit={handleSaveConfig}
          className="bg-sidebar border border-sidebar-border rounded-xl p-6 space-y-5 max-w-2xl"
        >
          <div className="space-y-2">
            <Label>
              {t(
                "finance.fkf.postalCodes",
                "Eligible postal codes (comma-separated)",
              )}
            </Label>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={postalText}
              onChange={(e) => setPostalText(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={programActive}
              onChange={(e) => setProgramActive(e.target.checked)}
            />
            {t(
              "finance.fkf.programActive",
              "Program active (annual L-Bank selection)",
            )}
          </label>

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
                  selectedStudent?.program_name,
                  selectedStudent?.batch_name,
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
    </div>
  );
};

export default FkfManagement;
