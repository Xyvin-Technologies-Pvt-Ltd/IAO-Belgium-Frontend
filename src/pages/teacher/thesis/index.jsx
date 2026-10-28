import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import {
  getTeacherThesisApprovalRequests,
  respondTeacherThesisApprovalRequest,
  getTeacherThesisContactCard,
  saveTeacherThesisContactCard,
} from "@/api/thesisApi";

const MAX_CONTACT_FIELDS = 20;

const blankField = () => ({ label: "", value: "" });

const RequestsTab = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionDraft, setActionDraft] = useState(null);
  const [note, setNote] = useState("");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [
      "teacher-thesis-approval-requests",
      page,
      rowsPerPage,
      statusFilter,
    ],
    queryFn: () =>
      getTeacherThesisApprovalRequests({
        page,
        limit: rowsPerPage,
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
          ? "Request accepted"
          : "Request rejected"
      );
      setActionDraft(null);
      setNote("");
      queryClient.invalidateQueries({
        queryKey: ["teacher-thesis-approval-requests"],
      });
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to update request");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {rows.length} of {totalRows} {totalRows === 1 ? "request" : "requests"}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            Status:
          </span>
          <Select
            value={statusFilter || "all"}
            onValueChange={(val) => {
              setStatusFilter(val === "all" ? "" : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-9 bg-background">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Thesis</TableHead>
              <TableHead>Trajectory</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    message={error?.message || "Failed to load requests"}
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
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={() => openAction(item, "rejected")}
                          >
                            Reject
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
                  No approval requests found.
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
                ? "Accept supervisor request"
                : "Reject supervisor request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {actionDraft?.request?.student
                ? `${actionDraft.request.student.first_name || ""} ${actionDraft.request.student.last_name || ""}`.trim()
                : "Student"}
              {actionDraft?.request?.thesis?.name
                ? ` · ${actionDraft.request.thesis.name}`
                : ""}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="teacher-note">Note (optional)</Label>
              <Textarea
                id="teacher-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Short note for the student or your records"
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
              Cancel
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
                ? "Saving..."
                : actionDraft?.status === "approved"
                  ? "Accept"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ContactInfoForm = ({ initialCard, onSave, isSaving }) => {
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
            Supervisor Contact Information
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Add any fields you want students to see after you accept their
            supervisor request. Empty rows are not shown to students.
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
                  Label
                </Label>
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, "label", e.target.value)}
                  placeholder="e.g. Email"
                  className="bg-background text-foreground border-border"
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Value
                </Label>
                <Input
                  value={field.value}
                  onChange={(e) => updateField(index, "value", e.target.value)}
                  placeholder="e.g. you@school.be"
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
                title="Remove field"
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
              Add field
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 shadow-xs"
            >
              {isSaving ? "Saving..." : "Save contact info"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ContactInfoTab = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["teacher-thesis-contact-card"],
    queryFn: getTeacherThesisContactCard,
  });

  const saveMutation = useMutation({
    mutationFn: (form) => saveTeacherThesisContactCard(form),
    onSuccess: () => {
      toast.success("Contact info saved successfully");
      queryClient.invalidateQueries({
        queryKey: ["teacher-thesis-contact-card"],
      });
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to save contact info");
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
        message={error?.message || "Failed to load contact card"}
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
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("teacherThesisActiveTab") || "requests";
  });

  useEffect(() => {
    localStorage.setItem("teacherThesisActiveTab", activeTab);
  }, [activeTab]);

  const tabs = [
    { id: "requests", label: "Requests" },
    { id: "contact", label: "My contact info" },
  ];

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-bold text-foreground">
        Thesis
      </h2>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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

      <div className="mt-6">
        {activeTab === "requests" ? <RequestsTab /> : <ContactInfoTab />}
      </div>
    </div>
  );
};

export default TeacherThesis;
