import { useEffect, useMemo, useState } from "react";
import moment from "moment-timezone";
import { toast } from "sonner";
import {
  Check,
  Eye,
  History,
  RefreshCw,
  ShieldOff,
  X,
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
import StudentIdPhotoCropModal from "@/components/admin/student-id/StudentIdPhotoCropModal";
import IdCardViewModal from "@/components/id-card/IdCardViewModal";
import ReissueChoiceModal from "@/components/id-card/ReissueChoiceModal";
import { checkIssueTeacherIdCard } from "@/api/teacherIdApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useGetUsers } from "@/store/useDropdownStore";
import {
  useApproveTeacherIdCard,
  useIssueTeacherIdCard,
  useRejectTeacherIdCard,
  useReissueTeacherIdCard,
  useRevokeTeacherIdCard,
  useTeacherIdCards,
  useTeacherIdUserActivity,
} from "@/store/useTeacherIdStore";

const STATUS_TABS = ["pending", "active", "rejected", "expired", "revoked"];
const PANEL_CLASS =
  "bg-white dark:bg-black/10 border dark:border-white/10 rounded-xl p-4 shadow-sm";
const TABLE_COLUMNS = 7;
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

function HistoryModal({ userId, open, onClose }) {
  const { data, isLoading } = useTeacherIdUserActivity(open ? userId : null);
  const payload = data?.data;
  const cards = Array.isArray(payload) ? [] : payload?.cards || [];
  const rows = Array.isArray(payload) ? payload : payload?.activity || [];
  const cardMap = useMemo(() => {
    const map = new Map();
    for (const c of cards) {
      if (c.document_id) map.set(String(c.document_id), c);
    }
    return map;
  }, [cards]);
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
                      <div className="flex items-center gap-2 font-medium text-dashboard-text dark:text-white truncate">
                        <span>{card.card_uid || "—"}</span>
                        <span>·</span>
                        <StatusBadge status={card.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCardDate(card.valid_from)} –{" "}
                        {formatCardDate(card.valid_until)}
                      </p>
                      {card.academic?.name ? (
                        <p className="text-xs text-muted-foreground">
                          {card.academic.name}
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
                {rows.map((entry, idx) => {
                  const cardUid =
                    entry.card_uid ||
                    cardMap.get(String(entry.card_id))?.card_uid;
                  return (
                    <div
                      key={`${entry.card_id}-${idx}`}
                      className="rounded border border-gray-100 dark:border-white/10 p-2"
                    >
                      <p className="font-medium text-dashboard-text dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>
                          {moment(entry.at).format("DD/MM/YYYY HH:mm:ss")}
                        </span>
                        <span>·</span>
                        {cardUid ? (
                          <>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#ff8904]/10 text-[#ff8904] dark:bg-[#ff8904]/20 border border-[#ff8904]/30">
                              {cardUid}
                            </span>
                            <span>·</span>
                          </>
                        ) : null}
                        <span>{entry.action}</span>
                        {entry.to_status ? (
                          <span>→ {entry.to_status}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By: {formatActivityActor(entry.actor)}
                      </p>
                      {entry.note ? (
                        <p className="text-muted-foreground">{entry.note}</p>
                      ) : null}
                    </div>
                  );
                })}
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

const TeacherIdAdminPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [issueOpen, setIssueOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [issuePhotoOpen, setIssuePhotoOpen] = useState(false);
  const [issueCheckPending, setIssueCheckPending] = useState(false);

  const [reasonModal, setReasonModal] = useState({
    open: false,
    mode: null,
    cardId: null,
  });
  const [historyUserId, setHistoryUserId] = useState(null);
  const [reissueChoiceCardId, setReissueChoiceCardId] = useState(null);
  const [reissueCardId, setReissueCardId] = useState(null);
  const [viewCard, setViewCard] = useState(null);

  const listParams = useMemo(
    () => ({
      page,
      limit: rowsPerPage,
      status,
      search: debouncedSearch || undefined,
    }),
    [page, rowsPerPage, status, debouncedSearch],
  );

  const { data, isLoading, isFetching } = useTeacherIdCards(listParams);
  const { data: usersData, isLoading: usersLoading } = useGetUsers(
    {
      ...(userSearchTerm && { search: userSearchTerm }),
      role: "teacher",
    },
    { enabled: issueOpen },
  );

  const teachers = (usersData?.data || []).map((user) => ({
    _id: user._id,
    name: user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
  }));

  const approveMutation = useApproveTeacherIdCard();
  const rejectMutation = useRejectTeacherIdCard();
  const revokeMutation = useRevokeTeacherIdCard();
  const reissueMutation = useReissueTeacherIdCard();
  const issueMutation = useIssueTeacherIdCard();

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const rows = data?.data || [];
  const totalRows = data?.total_count || data?.total || 0;
  const statusCounts = data?.status_counts || {};

  const reissueCard = useMemo(
    () => rows.find((c) => c.document_id === reissueChoiceCardId) || null,
    [rows, reissueChoiceCardId],
  );

  const openIssuePhoto = async () => {
    if (!selectedUserId) {
      toast.error("Select a teacher first");
      return;
    }
    try {
      setIssueCheckPending(true);
      await checkIssueTeacherIdCard(selectedUserId);
      setIssuePhotoOpen(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Cannot issue an ID card for this teacher",
      );
    } finally {
      setIssueCheckPending(false);
    }
  };

  const handleIssuePhoto = async (photo_key) => {
    await issueMutation.mutateAsync({
      user_id: selectedUserId,
      photo_key,
    });
    setIssuePhotoOpen(false);
    setIssueOpen(false);
    setSelectedUserId("");
    setUserSearchTerm("");
  };

  const handleReissuePhoto = async (photo_key) => {
    await reissueMutation.mutateAsync({ id: reissueCardId, photo_key });
    setReissueCardId(null);
  };

  const handleReissueKeepSame = async () => {
    await reissueMutation.mutateAsync({ id: reissueChoiceCardId });
    setReissueChoiceCardId(null);
  };

  const getRowActions = (card) => {
    const actions = [
      {
        label: "View ID card",
        icon: Eye,
        onClick: () => setViewCard(card),
      },
    ];
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
    if (card.status === "active" || card.status === "revoked") {
      actions.push({
        label: "Reissue",
        icon: RefreshCw,
        onClick: () => setReissueChoiceCardId(card.document_id),
      });
    }
    if (card.status === "active") {
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
      onClick: () => setHistoryUserId(card.user_id || null),
    });
    return actions;
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          IAO Teacher ID
        </h2>
      </div>

      <section className={`${PANEL_CLASS} space-y-3`}>
        <Button onClick={() => setIssueOpen((v) => !v)}>
          + Issue new ID card
        </Button>
        {issueOpen ? (
          <div className="grid gap-3 md:grid-cols-2 border dark:border-white/10 rounded-lg p-3">
            <div>
              <SearchableSelect
                label="Teacher"
                placeholder="Select a teacher"
                searchPlaceholder="Search"
                items={teachers}
                value={selectedUserId}
                onChange={setSelectedUserId}
                onSearch={setUserSearchTerm}
                isLoading={usersLoading}
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={openIssuePhoto}
                disabled={issueMutation.isPending || issueCheckPending}
              >
                {issueCheckPending ? "Checking…" : "Issue ID card"}
              </Button>
            </div>
          </div>
        ) : null}
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
            placeholder={t(
              "idCardManagement.searchPlaceholder",
              "Search by UID, name, or email...",
            )}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UID</TableHead>
              <TableHead>Photo</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Teacher ID</TableHead>
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
                  <TableCell className="whitespace-nowrap">
                    {card.card_uid || "—"}
                  </TableCell>
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
                    {card.teacher_name || card.student_name || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {card.teacher_uid || card.student_uid || "—"}
                  </TableCell>
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
          reasonModal.mode === "reject" ? "Reject photo" : "Revoke teacher ID"
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
        open={Boolean(historyUserId)}
        userId={historyUserId}
        onClose={() => setHistoryUserId(null)}
      />

      <IdCardViewModal
        open={Boolean(viewCard)}
        card={viewCard}
        hideProgram
        onClose={() => setViewCard(null)}
      />

      <StudentIdPhotoCropModal
        open={issuePhotoOpen}
        title="Issue teacher ID — crop photo"
        confirmLabel="Issue ID card"
        isSubmitting={issueMutation.isPending}
        onClose={() => setIssuePhotoOpen(false)}
        onSubmit={handleIssuePhoto}
      />

      <ReissueChoiceModal
        open={Boolean(reissueChoiceCardId)}
        card={reissueCard}
        loading={reissueMutation.isPending}
        onClose={() => setReissueChoiceCardId(null)}
        onKeepSame={handleReissueKeepSame}
        onUploadNew={() => {
          setReissueCardId(reissueChoiceCardId);
          setReissueChoiceCardId(null);
        }}
      />

      <StudentIdPhotoCropModal
        open={Boolean(reissueCardId)}
        title="Reissue with new photo"
        confirmLabel="Reissue ID card"
        isSubmitting={reissueMutation.isPending}
        onClose={() => setReissueCardId(null)}
        onSubmit={handleReissuePhoto}
      />
    </div>
  );
};

export default TeacherIdAdminPage;
