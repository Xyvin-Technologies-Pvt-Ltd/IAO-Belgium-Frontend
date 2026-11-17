import { useEffect, useMemo, useState } from "react";
import moment from "moment-timezone";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  History,
  RefreshCw,
  ShieldOff,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Pagination } from "@/components/ui/table/Pagination";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import StatusBadge from "@/components/StatusBadge";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { uploadFile } from "@/api/uploadApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetUsers } from "@/store/useDropdownStore";
import {
  useApproveStudentIdCard,
  useIssueStudentIdCard,
  useRejectStudentIdCard,
  useReissueStudentIdCard,
  useRevokeStudentIdCard,
  useSimulateYearlyReissue,
  useStudentIdApplicationActivity,
  useStudentIdCards,
  useStudentIdEligibility,
  useUpdateStudentIdEligibility,
} from "@/store/useStudentIdStore";

const STATUS_TABS = [
  "pending",
  "active",
  "rejected",
  "expired",
  "revoked",
];

const PANEL_CLASS =
  "bg-white dark:bg-black/10 border dark:border-white/10 rounded-xl p-4 shadow-sm";

const TABLE_COLUMNS = 8;
const CARD_TZ = "Europe/Brussels";

const formatCardDate = (value) =>
  value ? moment.tz(value, CARD_TZ).format("DD/MM/YYYY") : "—";

function ReasonModal({ open, title, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-black border dark:border-white/20 p-5 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-dashboard-text dark:text-white">
          {title}
        </h3>
        <textarea
          className="w-full min-h-28 rounded-md border border-gray-300 dark:border-white/20 dark:bg-black/40 dark:text-white p-3 text-sm"
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            disabled={loading || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatActivityActor(actor) {
  if (!actor) return "System";
  if (typeof actor === "string") return actor;
  const name = [actor.first_name, actor.last_name].filter(Boolean).join(" ");
  if (name) return name;
  return actor.email || "Unknown";
}

function HistoryModal({ applicationId, open, onClose }) {
  const { data, isLoading } = useStudentIdApplicationActivity(
    open ? applicationId : null,
  );
  const payload = data?.data;
  const cards = Array.isArray(payload) ? [] : payload?.cards || [];
  const rows = Array.isArray(payload) ? payload : payload?.activity || [];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-black border dark:border-white/20 p-5 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-dashboard-text dark:text-white">
          History
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : cards.length === 0 && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history yet.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-4 text-sm">
            {cards.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cards
                </p>
                {cards.map((card) => (
                  <div
                    key={card.document_id}
                    className="flex items-center gap-3 rounded border border-gray-100 dark:border-white/10 p-2"
                  >
                    <div className="h-14 w-12 overflow-hidden rounded border dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0">
                      {card.photo_url ? (
                        <img
                          src={card.photo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-dashboard-text dark:text-white truncate">
                        {card.academic?.name || "—"} ·{" "}
                        <span className="capitalize">{card.status}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCardDate(card.valid_from)} –{" "}
                        {formatCardDate(card.valid_until)}
                      </p>
                      {card.issued_by ? (
                        <p className="text-xs text-muted-foreground capitalize">
                          Issued by: {card.issued_by}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {rows.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Activity
                </p>
                {rows.map((entry, idx) => (
                  <div
                    key={`${entry.card_id}-${idx}`}
                    className="rounded border border-gray-100 dark:border-white/10 p-2"
                  >
                    <p className="font-medium text-dashboard-text dark:text-white">
                      {moment(entry.at).format("DD/MM/YYYY HH:mm:ss")} ·{" "}
                      {entry.action}
                      {entry.to_status ? ` → ${entry.to_status}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By: {formatActivityActor(entry.actor)}
                      {entry.actor?.email ? ` (${entry.actor.email})` : ""}
                    </p>
                    {entry.card_status ? (
                      <p className="text-xs text-muted-foreground capitalize">
                        Card: {entry.card_status}
                      </p>
                    ) : null}
                    {entry.note ? (
                      <p className="text-muted-foreground">{entry.note}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

const StudentIdAdminPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [eligDraft, setEligDraft] = useState([]);
  const [issueOpen, setIssueOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [issueFile, setIssueFile] = useState(null);

  const [reasonModal, setReasonModal] = useState({
    open: false,
    mode: null,
    cardId: null,
  });
  const [historyApplicationId, setHistoryApplicationId] = useState(null);
  const [reissueCardId, setReissueCardId] = useState(null);

  const listParams = useMemo(
    () => ({
      page,
      limit: rowsPerPage,
      status,
      search: debouncedSearch || undefined,
    }),
    [page, rowsPerPage, status, debouncedSearch],
  );

  const { data, isLoading, isFetching } = useStudentIdCards(listParams);
  const { data: eligData } = useStudentIdEligibility();
  const { data: usersData, isLoading: usersLoading } = useGetUsers(
    {
      ...(userSearchTerm && { search: userSearchTerm }),
      role: "student",
    },
    { enabled: issueOpen },
  );

  const students = (usersData?.data || []).map((user) => ({
    _id: user._id,
    name: user.name,
  }));

  const updateEligibility = useUpdateStudentIdEligibility();
  const approveMutation = useApproveStudentIdCard();
  const rejectMutation = useRejectStudentIdCard();
  const revokeMutation = useRevokeStudentIdCard();
  const reissueMutation = useReissueStudentIdCard();
  const issueMutation = useIssueStudentIdCard();
  const yearlyMutation = useSimulateYearlyReissue();

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  useEffect(() => {
    if (eligData?.data) {
      setEligDraft(
        eligData.data.map((row) => ({
          program_type: row.program_type,
          student_id_eligible: Boolean(row.student_id_eligible),
        })),
      );
    }
  }, [eligData]);

  const rows = data?.data || [];
  const totalRows = data?.total_count || data?.total || 0;
  const statusCounts = data?.status_counts || {};

  const saveEligibility = () => {
    updateEligibility.mutate(
      eligDraft.map(({ program_type, student_id_eligible }) => ({
        program_type,
        student_id_eligible,
      })),
    );
  };

  const handleIssue = async () => {
    if (!selectedUserId || !issueFile) {
      toast.error("Select a student and photo");
      return;
    }
    try {
      const uploadRes = await uploadFile(issueFile);
      const photo_key = uploadRes?.data?.key || uploadRes?.key;
      if (!photo_key) throw new Error("Upload failed");
      await issueMutation.mutateAsync({
        user_id: selectedUserId,
        photo_key,
      });
      setIssueOpen(false);
      setSelectedUserId("");
      setIssueFile(null);
      setUserSearchTerm("");
    } catch (err) {
      toast.error(err?.message || "Failed to issue card");
    }
  };

  const handleReissueFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !reissueCardId) return;
    try {
      const uploadRes = await uploadFile(file);
      const photo_key = uploadRes?.data?.key || uploadRes?.key;
      if (!photo_key) throw new Error("Upload failed");
      await reissueMutation.mutateAsync({ id: reissueCardId, photo_key });
      setReissueCardId(null);
    } catch (err) {
      toast.error(err?.message || "Failed to reissue");
    } finally {
      e.target.value = "";
    }
  };

  const getRowActions = (card) => {
    const actions = [];
    if (card.status === "pending") {
      actions.push({
        label: "Approve",
        icon: Check,
        onClick: () => approveMutation.mutate(card.document_id),
      });
      actions.push({
        label: "Reject",
        icon: X,
        className: "text-red-600 focus:text-red-600",
        onClick: () =>
          setReasonModal({
            open: true,
            mode: "reject",
            cardId: card.document_id,
          }),
      });
    }
    if (card.status === "active") {
      actions.push({
        label: "Reissue with new photo",
        icon: RefreshCw,
        onClick: () => setReissueCardId(card.document_id),
      });
      actions.push({
        label: "Revoke ID",
        icon: ShieldOff,
        className: "text-red-600 focus:text-red-600",
        onClick: () =>
          setReasonModal({
            open: true,
            mode: "revoke",
            cardId: card.document_id,
          }),
      });
    }
    actions.push({
      label: "History",
      icon: History,
      onClick: () => setHistoryApplicationId(card.application_id || null),
    });
    if (card.application_id) {
      actions.push({
        label: "Open enrollment",
        icon: ExternalLink,
        onClick: () =>
          navigate({
            to: "/admin/student-management/$id",
            params: { id: String(card.application_id) },
          }),
      });
    }
    return actions;
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          Show Student ID
        </h2>
      </div>

      <section className={`${PANEL_CLASS} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-dashboard-text dark:text-white">
            Programmes that receive a Student ID
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => yearlyMutation.mutate()}
              disabled={yearlyMutation.isPending}
            >
              Simulate yearly reissue (1 Sept)
            </Button>
            <Button
              onClick={saveEligibility}
              disabled={updateEligibility.isPending}
            >
              Save eligibility
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {eligDraft.map((p) => (
            <label
              key={p.program_type}
              className="flex items-center gap-2 rounded-md border dark:border-white/10 px-3 py-2 text-sm text-dashboard-text dark:text-white"
            >
              <input
                type="checkbox"
                checked={p.student_id_eligible}
                onChange={(e) =>
                  setEligDraft((prev) =>
                    prev.map((row) =>
                      row.program_type === p.program_type
                        ? {
                            ...row,
                            student_id_eligible: e.target.checked,
                          }
                        : row,
                    ),
                  )
                }
              />
              <span>{p.program_type}</span>
            </label>
          ))}
        </div>
      </section>

      <section className={`${PANEL_CLASS} space-y-3`}>
        <Button onClick={() => setIssueOpen((v) => !v)}>
          + Issue new ID card
        </Button>
        {issueOpen && (
          <div className="grid gap-3 md:grid-cols-3 border dark:border-white/10 rounded-lg p-3">
            <div>
              <SearchableSelect
                label="Student"
                placeholder="Select a student"
                searchPlaceholder="Search"
                items={students}
                value={selectedUserId}
                onChange={setSelectedUserId}
                onSearch={setUserSearchTerm}
                isLoading={usersLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-dashboard-text dark:text-white">
                Student photo
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setIssueFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleIssue}
                disabled={issueMutation.isPending}
              >
                Issue ID card
              </Button>
            </div>
          </div>
        )}
      </section>

      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab;
            const count = statusCounts[tab] || 0;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatus(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-[#ff8904] text-[#ff8904]"
                    : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span
                  className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-[#ff8904]/15 text-[#ff8904]"
                      : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Search by name or student ID"
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Card</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={TABLE_COLUMNS} />
            ) : rows.length > 0 ? (
              rows.map((card) => (
                <TableRow
                  key={card.document_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <TableCell>
                    <div className="h-12 w-10 overflow-hidden rounded border dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      {card.photo_url ? (
                        <img
                          src={card.photo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400">
                          —
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {card.student_name || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {card.student_uid || "—"}
                  </TableCell>
                  <TableCell>{card.program?.name || "—"}</TableCell>
                  <TableCell>{card.card_title || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {card.valid_from || card.valid_until
                      ? `${formatCardDate(card.valid_from)} – ${formatCardDate(card.valid_until)}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={card.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RowActionMenu actions={getRowActions(card)} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMNS} className="text-center">
                  No cards found.
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

      <ReasonModal
        open={reasonModal.open}
        title={
          reasonModal.mode === "reject" ? "Reject photo" : "Revoke student ID"
        }
        loading={rejectMutation.isPending || revokeMutation.isPending}
        onClose={() =>
          setReasonModal({ open: false, mode: null, cardId: null })
        }
        onConfirm={async (reason) => {
          if (reasonModal.mode === "reject") {
            await rejectMutation.mutateAsync({
              id: reasonModal.cardId,
              reason,
            });
          } else {
            await revokeMutation.mutateAsync({
              id: reasonModal.cardId,
              reason,
            });
          }
          setReasonModal({ open: false, mode: null, cardId: null });
        }}
      />

      <HistoryModal
        open={Boolean(historyApplicationId)}
        applicationId={historyApplicationId}
        onClose={() => setHistoryApplicationId(null)}
      />

      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="reissue-photo-input"
        onChange={handleReissueFile}
      />
      {reissueCardId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-black border dark:border-white/20 p-5 space-y-3">
            <h3 className="font-semibold text-dashboard-text dark:text-white">
              Reissue with new photo
            </h3>
            <Input
              type="file"
              accept="image/*"
              onChange={handleReissueFile}
            />
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setReissueCardId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentIdAdminPage;
