import React from "react";
import { Clock, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function getProformaStatusChip(proforma) {
  if (proforma?.status === "MOVED_TO_FINANCE" || proforma?.status === "PAID") {
    return {
      label: proforma.status === "PAID" ? "Paid" : "In finance",
      className: "bg-violet-100 text-violet-800 border-violet-200",
    };
  }
  if (proforma?.digital_signature?.is_signed || proforma?.status === "TEACHER_SIGNED_APPROVED") {
    return { label: "Signed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }
  if (proforma?.status === "CHANGE_REQUESTED") {
    if (proforma?.workflow_next_actor === "ADMIN") {
      return { label: "Awaiting admin", className: "bg-amber-100 text-amber-900 border-amber-200" };
    }
    return { label: "Awaiting teacher", className: "bg-orange-100 text-orange-900 border-orange-200" };
  }
  return { label: "Awaiting teacher", className: "bg-sky-100 text-sky-900 border-sky-200" };
}

const ACTION_LABELS = {
  TEACHER_UPDATED_SECTION: "Teacher updated section",
  SECTION_EDITED: "Admin edited section",
  SECTION_APPROVED: "Section confirmed / accepted",
  SECTION_UNAPPROVED: "Section unconfirmed",
  TEACHER_SIGNED: "Teacher signed",
  STATUS_CHANGED: "Status changed",
  ATTACHMENT_ADDED: "Document attached",
  COMMENT_ADDED: "Note added",
  SENT_TO_FINANCE: "Sent to finance",
  MOVED_TO_FINANCE: "Moved to finance",
  SIGNATURE_VOIDED: "Signature cleared",
};

export function formatAuditAction(action) {
  if (!action) return "Update";
  return ACTION_LABELS[action] || action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Who changed what last — visible to teacher and admin */
export function ProformaLatestChangeBanner({ proforma, viewerRole = "ADMIN" }) {
  const rev = proforma?.last_revision;
  if (!rev?.reason && !rev?.requested_by_name) return null;

  const byAdmin = rev.requested_by_role === "BACKOFFICE" || rev.requested_by_role === "ADMIN";
  const byTeacher = rev.requested_by_role === "TEACHER";
  const isOwn = (viewerRole === "ADMIN" && byAdmin) || (viewerRole === "TEACHER" && byTeacher);
  const who = byTeacher ? "Teacher" : "Admin";
  const sections = Array.isArray(rev.sections) && rev.sections.length > 0 ? rev.sections.join(", ") : null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 space-y-2">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
            {isOwn ? "Your last update" : `Latest update from ${who}`}
          </p>
          <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
            <span className="font-semibold">{rev.requested_by_name || who}</span>
            {rev.requested_at && (
              <>
                {" · "}
                {new Date(rev.requested_at).toLocaleString()}
              </>
            )}
            {sections && (
              <>
                {" · Only: "}
                <span className="font-mono font-semibold">{sections}</span>
                <span> (other sections unchanged)</span>
              </>
            )}
          </p>
          {rev.reason && (
            <p className="text-sm text-amber-950 dark:text-amber-50 leading-relaxed">{rev.reason}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProformaActivityLog({ logs = [], emptyText = "No activity recorded yet." }) {
  const sorted = [...(logs || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <Card className="border border-border">
      <CardHeader className="py-3.5 px-5 bg-muted/20 border-b border-border">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          Activity log
          <span className="text-xs font-normal text-muted-foreground">({sorted.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 max-h-80 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((log, idx) => {
              const roleLabel =
                log.performed_by_role === "TEACHER"
                  ? "Teacher"
                  : log.performed_by_role === "ADMIN" || log.performed_by_role === "BACKOFFICE"
                    ? "Admin"
                    : log.performed_by_role || "";

              return (
                <li key={idx} className="px-5 py-3 text-xs space-y-1 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-bold text-foreground">
                        {log.performed_by_name || roleLabel || "System"}
                      </span>
                      {roleLabel && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                          {roleLabel}
                        </span>
                      )}
                      <span className="text-muted-foreground"> · </span>
                      <span className="font-medium text-foreground/90">{formatAuditAction(log.action)}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap shrink-0">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
                    </span>
                  </div>

                  {(log.old_value || log.new_value) && (
                    <p className="font-mono text-[11px] text-muted-foreground break-all">
                      {log.field_changed && (
                        <span className="text-foreground/70">{String(log.field_changed).replace(/_/g, " ")}: </span>
                      )}
                      {log.old_value != null && <span>{String(log.old_value)}</span>}
                      {log.old_value != null && log.new_value != null && (
                        <span className="mx-1 text-amber-700">→</span>
                      )}
                      {log.new_value != null && (
                        <span className="text-foreground font-semibold">{String(log.new_value)}</span>
                      )}
                    </p>
                  )}

                  {log.notes && (
                    <p className="text-muted-foreground leading-relaxed">{log.notes}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
