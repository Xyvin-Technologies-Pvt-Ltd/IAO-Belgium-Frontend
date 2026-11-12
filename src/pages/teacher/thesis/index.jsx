import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Trash2, Search } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTZ } from "@/utils/dateUtils";
import { useDebounce } from "@/hooks/useDebounce";
import { useThesisTeacherKind } from "@/hooks/useThesisTeacherKind";
import {
  getTeacherThesisStudents,
  getTeacherThesisApprovalRequests,
  respondTeacherThesisApprovalRequest,
  getTeacherThesisContactCard,
  saveTeacherThesisContactCard,
} from "@/api/thesisApi";

const formatRoleLabel = (role, t) => {
  if (role === "supervisor")
    return t("thesisManagement.teacher.supervisor", "Supervisor");
  if (role === "reader") return t("thesisManagement.teacher.reader", "Reader");
  if (role === "additional_reader")
    return t(
      "thesisManagement.teacher.additionalReader",
      "Additional Reader"
    );
  return role
    ? String(role)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
};

const MAX_CONTACT_FIELDS = 20;

const blankField = () => ({ label: "", value: "" });

const RequestsTab = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { type } = useThesisTeacherKind();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionDraft, setActionDraft] = useState(null);
  const [note, setNote] = useState("");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [
      "teacher-thesis-approval-requests",
      type,
      page,
      rowsPerPage,
      statusFilter,
    ],
    queryFn: () =>
      getTeacherThesisApprovalRequests({
        page,
        limit: rowsPerPage,
        type,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
  });

  const respondMutation = useMutation({
    mutationFn: ({ requestId, status, note: teacherNote }) =>
      respondTeacherThesisApprovalRequest(requestId, {
        status,
        note: teacherNote || "",
      }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "approved"
          ? t("thesisManagement.teacher.requestAccepted", "Request accepted")
          : t("thesisManagement.teacher.requestRejected", "Request rejected")
      );
      setActionDraft(null);
      setNote("");
      queryClient.invalidateQueries({
        queryKey: ["teacher-thesis-approval-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["teacher-thesis-students"],
      });
    },
    onError: (err) => {
      toast.error(
        err?.message ||
          t("thesisManagement.teacher.requestUpdateFailed", "Failed to update request")
      );
    },
  });

  const rows = data?.data || [];
  const totalRows = data?.total_count || 0;

  const openAction = (request, status) => {
    setActionDraft({ request, status });
    setNote("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            {t("thesisManagement.teacher.statusLabel", "Status:")}
          </span>
          <Select
            value={statusFilter || "all"}
            onValueChange={(val) => {
              setStatusFilter(val === "all" ? "" : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-9 bg-background">
              <SelectValue
                placeholder={t(
                  "thesisManagement.teacher.allStatuses",
                  "All statuses"
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                {t("thesisManagement.teacher.pending", "Pending")}
              </SelectItem>
              <SelectItem value="approved">
                {t("thesisManagement.teacher.approved", "Approved")}
              </SelectItem>
              <SelectItem value="rejected">
                {t("thesisManagement.teacher.rejected", "Rejected")}
              </SelectItem>
              <SelectItem value="all">
                {t("thesisManagement.teacher.allStatuses", "All statuses")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("thesisManagement.teacher.student", "Student")}
              </TableHead>
              <TableHead>
                {t("thesisManagement.teacher.thesis", "Thesis")}
              </TableHead>
              <TableHead>
                {t("thesisManagement.teacher.trajectory", "Trajectory")}
              </TableHead>
              <TableHead>
                {t("thesisManagement.teacher.step", "Step")}
              </TableHead>
              <TableHead>
                {t("thesisManagement.teacher.requested", "Requested")}
              </TableHead>
              <TableHead>
                {t("thesisManagement.teacher.status", "Status")}
              </TableHead>
              <TableHead className="text-right">
                {t("thesisManagement.teacher.actions", "Actions")}
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
                <TableCell colSpan={7} className="text-center p-8">
                  <ErrorMessage
                    message={
                      error?.message ||
                      t(
                        "thesisManagement.teacher.loadRequestsFailed",
                        "Failed to load requests"
                      )
                    }
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((item) => {
                const studentName = item.student
                  ? `${item.student.last_name || ""} ${item.student.first_name || ""}`.trim()
                  : "-";
                return (
                  <TableRow key={item._id}>
                    <TableCell className="capitalize">
                      <div className="space-y-0.5">
                        <div className="font-medium">{studentName || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.student?.uid || item.application?.uid || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={item.thesis?.name}
                    >
                      {item.thesis?.name || "-"}
                    </TableCell>
                    <TableCell
                      className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={item.trajectory?.name}
                    >
                      {item.trajectory?.name || "-"}
                    </TableCell>
                    <TableCell
                      className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={item.step?.name}
                    >
                      {item.step?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {formatTZ(
                        item.created_at || item.createdAt,
                        "MMM DD, YYYY"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                      {item.teacher_note ? (
                        <p
                          className="text-xs text-muted-foreground mt-1 max-w-[180px] truncate"
                          title={item.teacher_note}
                        >
                          {item.teacher_note}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === "pending" ? (
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => openAction(item, "approved")}
                          >
                            {t("thesisManagement.teacher.accept", "Accept")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={() => openAction(item, "rejected")}
                          >
                            {t("thesisManagement.teacher.reject", "Reject")}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center p-4">
                  {t(
                    "thesisManagement.teacher.noRequests",
                    "No approval requests found."
                  )}
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
      </div>

      <Dialog
        open={!!actionDraft}
        onOpenChange={(open) => {
          if (!open) {
            setActionDraft(null);
            setNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDraft?.status === "approved"
                ? t(
                    "thesisManagement.teacher.acceptRequest",
                    "Accept supervisor request"
                  )
                : t(
                    "thesisManagement.teacher.rejectRequest",
                    "Reject supervisor request"
                  )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {actionDraft?.request?.student
                ? `${actionDraft.request.student.first_name || ""} ${actionDraft.request.student.last_name || ""}`.trim()
                : t("thesisManagement.teacher.student", "Student")}
              {actionDraft?.request?.thesis?.name
                ? ` · ${actionDraft.request.thesis.name}`
                : ""}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="teacher-note">
                {t("thesisManagement.teacher.noteOptional", "Note (optional)")}
              </Label>
              <Textarea
                id="teacher-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t(
                  "thesisManagement.teacher.notePlaceholder",
                  "Short note for the student or your records"
                )}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionDraft(null);
                setNote("");
              }}
              disabled={respondMutation.isPending}
            >
              {t("thesisManagement.teacher.cancel", "Cancel")}
            </Button>
            <Button
              variant={
                actionDraft?.status === "rejected" ? "destructive" : "default"
              }
              disabled={respondMutation.isPending}
              onClick={() =>
                respondMutation.mutate({
                  requestId: actionDraft.request._id,
                  status: actionDraft.status,
                  note,
                })
              }
            >
              {respondMutation.isPending
                ? t("thesisManagement.teacher.saving", "Saving...")
                : actionDraft?.status === "approved"
                  ? t("thesisManagement.teacher.accept", "Accept")
                  : t("thesisManagement.teacher.reject", "Reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ContactInfoForm = ({ initialCard, onSave, isSaving }) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState(() => {
    const existing = Array.isArray(initialCard?.fields)
      ? initialCard.fields.map((f) => ({
          label: f?.label || "",
          value: f?.value || "",
        }))
      : [];
    return existing.length > 0 ? existing : [blankField()];
  });

  const updateField = (index, key, value) => {
    setFields((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  };

  const addField = () => {
    setFields((prev) => {
      if (prev.length >= MAX_CONTACT_FIELDS) return prev;
      return [...prev, blankField()];
    });
  };

  const removeField = (index) => {
    setFields((prev) => {
      if (prev.length <= 1) return [blankField()];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      fields: fields.map((f) => ({
        label: String(f.label || "").trim(),
        value: String(f.value || "").trim(),
      })),
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-2xs space-y-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {t(
              "thesisManagement.teacher.contactTitle",
              "Supervisor Contact Information"
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t(
              "thesisManagement.teacher.contactDesc",
              "Add any fields you want students to see after you accept their supervisor request. Empty rows are not shown to students."
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {fields.map((field, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2 items-end"
            >
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {t("thesisManagement.teacher.fieldLabel", "Label")}
                </Label>
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, "label", e.target.value)}
                  placeholder={t(
                    "thesisManagement.teacher.labelPlaceholder",
                    "e.g. Email"
                  )}
                  className="bg-background text-foreground border-border"
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {t("thesisManagement.teacher.fieldValue", "Value")}
                </Label>
                <Input
                  value={field.value}
                  onChange={(e) => updateField(index, "value", e.target.value)}
                  placeholder={t(
                    "thesisManagement.teacher.valuePlaceholder",
                    "e.g. name@example.com"
                  )}
                  className="bg-background text-foreground border-border"
                  maxLength={2000}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeField(index)}
                title={t(
                  "thesisManagement.teacher.removeField",
                  "Remove field"
                )}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={addField}
              disabled={fields.length >= MAX_CONTACT_FIELDS}
            >
              <Plus className="w-4 h-4" />
              {t("thesisManagement.teacher.addField", "Add field")}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 shadow-xs"
            >
              {isSaving
                ? t("thesisManagement.teacher.saving", "Saving...")
                : t(
                    "thesisManagement.teacher.saveContact",
                    "Save contact info"
                  )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentsTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type, basePath, isMaster } = useThesisTeacherKind();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [thesisFilter, setThesisFilter] = useState("all");
  const [markingFilter, setMarkingFilter] = useState("all");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, thesisFilter, markingFilter]);

  useEffect(() => {
    setThesisFilter("all");
    setMarkingFilter("all");
    setSearch("");
    setPage(1);
  }, [type]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [
      "teacher-thesis-students",
      type,
      page,
      rowsPerPage,
      debouncedSearch,
      thesisFilter,
      markingFilter,
    ],
    queryFn: () =>
      getTeacherThesisStudents({
        page,
        limit: rowsPerPage,
        type,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(thesisFilter !== "all" ? { thesis_id: thesisFilter } : {}),
        ...(markingFilter !== "all"
          ? { marking_status: markingFilter }
          : {}),
      }),
  });

  const rows = data?.data || [];
  const totalRows = data?.total_count || 0;
  const filterTheses = data?.filter_theses || [];
  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    thesisFilter !== "all" ||
    markingFilter !== "all";

  const studentName = (student) => {
    if (!student) return "—";
    const name = `${student.first_name || ""} ${student.last_name || ""}`.trim();
    return name || student.email || student.uid || "—";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-3">
        <Select value={thesisFilter} onValueChange={setThesisFilter}>
          <SelectTrigger className="w-full sm:w-56 h-9 bg-background">
            <SelectValue
              placeholder={t(
                "thesisManagement.teacher.filterThesis",
                "All theses"
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("thesisManagement.teacher.allTheses", "All theses")}
            </SelectItem>
            {filterTheses.map((thesis) => (
              <SelectItem key={String(thesis._id)} value={String(thesis._id)}>
                {thesis.name || String(thesis._id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={markingFilter} onValueChange={setMarkingFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9 bg-background">
            <SelectValue
              placeholder={t(
                "thesisManagement.teacher.filterMarking",
                "All marking"
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("thesisManagement.teacher.allMarking", "All marking")}
            </SelectItem>
            <SelectItem value="marked">
              {t("thesisManagement.teacher.marked", "Marked")}
            </SelectItem>
            <SelectItem value="not_marked">
              {t("thesisManagement.teacher.notMarked", "Not marked")}
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "thesisManagement.teacher.searchStudents",
              "Search by student name..."
            )}
            className="pl-9 h-9 bg-background"
          />
        </div>
      </div>

      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("thesisManagement.teacher.student", "Student")}
              </TableHead>
              <TableHead>
                {t("thesisManagement.teacher.thesis", "Thesis")}
              </TableHead>
              <TableHead>
                {t("thesisManagement.teacher.trajectory", "Trajectory")}
              </TableHead>
              <TableHead>
                {t("thesisManagement.teacher.role", "Role")}
              </TableHead>
              <TableHead>
                {t("thesisManagement.teacher.marking", "Marking")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={5} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center p-8">
                  <ErrorMessage
                    message={
                      error?.message ||
                      t(
                        "thesisManagement.teacher.loadStudentsFailed",
                        "Failed to load students"
                      )
                    }
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((row) => {
                const key = `${row.application?._id || ""}-${row.thesis?._id || ""}-${row.trajectory?._id || ""}`;
                const isMarked = row.marking_status === "marked";
                return (
                  <TableRow
                    key={key}
                    className="cursor-pointer"
                    onClick={() => {
                      if (
                        !row.thesis?._id ||
                        !row.trajectory?._id ||
                        !row.student?._id
                      ) {
                        return;
                      }
                      navigate({
                        to: `${basePath}/$thesisId/trajectories/$trajectoryId/students/$userId`,
                        params: {
                          thesisId: row.thesis._id,
                          trajectoryId: row.trajectory._id,
                          userId: row.student._id,
                        },
                      });
                    }}
                  >
                    <TableCell className="capitalize">
                      <div className="space-y-0.5">
                        <div className="font-medium">
                          {studentName(row.student)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.student?.uid || row.application?.uid || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={row.thesis?.name}
                    >
                      {row.thesis?.name || "-"}
                    </TableCell>
                    <TableCell
                      className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={row.trajectory?.name}
                    >
                      {row.trajectory?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {(row.roles || []).length > 0 ? (
                          row.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
                            >
                              {formatRoleLabel(role, t)}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          isMarked
                            ? "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                        }
                      >
                        {isMarked
                          ? t("thesisManagement.teacher.marked", "Marked")
                          : t(
                              "thesisManagement.teacher.notMarked",
                              "Not marked"
                            )}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center p-8 text-muted-foreground"
                >
                  {hasActiveFilters
                    ? t(
                        "thesisManagement.teacher.noStudentsMatch",
                        "No students match your search."
                      )
                    : isMaster
                      ? t(
                          "thesisManagement.teacher.noStudentsMaster",
                          "No assigned students yet. Supervisor and reader assignments from the backoffice appear here."
                        )
                      : t(
                          "thesisManagement.teacher.noStudentsDo",
                          "No assigned students yet. Accepted supervisor requests and reader assignments appear here."
                        )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalRows > 0 && (
          <Pagination
            page={page}
            setPage={setPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            totalRows={totalRows}
          />
        )}
      </div>
    </div>
  );
};

const ContactInfoTab = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["teacher-thesis-contact-card"],
    queryFn: getTeacherThesisContactCard,
  });

  const saveMutation = useMutation({
    mutationFn: (form) => saveTeacherThesisContactCard(form),
    onSuccess: () => {
      toast.success(
        t(
          "thesisManagement.teacher.contactSaved",
          "Contact info saved successfully"
        )
      );
      queryClient.invalidateQueries({
        queryKey: ["teacher-thesis-contact-card"],
      });
    },
    onError: (err) => {
      toast.error(
        err?.message ||
          t(
            "thesisManagement.teacher.contactSaveFailed",
            "Failed to save contact info"
          )
      );
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl bg-card border border-border rounded-xl p-6 sm:p-7 space-y-4">
        <div className="h-6 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-4 w-72 bg-muted animate-pulse rounded-md" />
        <div className="space-y-4 pt-2">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-24 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={
          error?.message ||
          t(
            "thesisManagement.teacher.loadContactFailed",
            "Failed to load contact card"
          )
        }
        onRetry={refetch}
      />
    );
  }

  return (
    <ContactInfoForm
      key={dataUpdatedAt || "contact-form"}
      initialCard={data?.data}
      onSave={(formData) => saveMutation.mutate(formData)}
      isSaving={saveMutation.isPending}
    />
  );
};

const TeacherThesis = () => {
  const { t } = useTranslation();
  const { type, label, isMaster, isDo } = useThesisTeacherKind();
  const storageKey = `teacherThesisActiveTab:${type}`;

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (isMaster) return "students";
    return saved || "requests";
  });

  useEffect(() => {
    if (isMaster && activeTab !== "students") {
      setActiveTab("students");
      return;
    }
    localStorage.setItem(storageKey, activeTab);
  }, [activeTab, isMaster, storageKey]);

  const tabs = isMaster
    ? [
        {
          id: "students",
          label: t("thesisManagement.teacher.tabStudents", "Students"),
        },
      ]
    : [
        {
          id: "requests",
          label: t("thesisManagement.teacher.tabRequests", "Requests"),
        },
        {
          id: "students",
          label: t("thesisManagement.teacher.tabStudents", "Students"),
        },
        {
          id: "contact",
          label: t("thesisManagement.teacher.tabContact", "My contact info"),
        },
      ];

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-bold text-foreground">{label}</h2>

      {tabs.length > 1 && (
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className={tabs.length > 1 ? "mt-6" : undefined}>
        {isDo && activeTab === "requests" && <RequestsTab />}
        {activeTab === "students" && <StudentsTab />}
        {isDo && activeTab === "contact" && <ContactInfoTab />}
      </div>
    </div>
  );
};

export default TeacherThesis;
