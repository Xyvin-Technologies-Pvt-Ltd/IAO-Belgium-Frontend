import React from "react";

/**
 * Fixed per-session travel display — same formula-box language as road travel.
 */
export default function ProformaTravelFixedCard({ items = [] }) {
  const lines = Array.isArray(items) ? items : [];
  if (lines.length === 0) return null;

  const sessionCount = lines.length;
  const rate = Number(lines[0]?.unit_rate || lines[0]?.line_total || 0);
  const total =
    Math.round(lines.reduce((sum, line) => sum + Number(line.line_total || 0), 0) * 100) / 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-sm">
        <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
          <span className="text-muted-foreground sm:w-36 shrink-0">Pricing mode</span>
          <span className="text-foreground font-medium">Fixed rate per session</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
          <span className="text-muted-foreground sm:w-36 shrink-0">Sessions</span>
          <span className="text-foreground font-medium font-mono">{sessionCount}</span>
        </div>
        {lines.some((l) => l.session_date) && (
          <div className="flex flex-col sm:flex-row sm:gap-6 gap-1 items-start">
            <span className="text-muted-foreground sm:w-36 shrink-0">Session dates</span>
            <span className="text-foreground font-medium">
              {lines
                .map((l) =>
                  l.session_date
                    ? new Date(l.session_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null
                )
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <FormulaBox value={String(sessionCount)} label={sessionCount === 1 ? "session" : "sessions"} />
        <span className="text-muted-foreground font-semibold text-sm">×</span>
        <FormulaBox value={rate > 0 ? `€${rate.toFixed(2)}` : "—"} label="per session" />
        <span className="text-muted-foreground font-semibold text-sm">=</span>
        <FormulaBox value={`€${total.toFixed(2)}`} label="travel allowance" highlight />
      </div>

      {lines.length > 1 && (
        <div className="space-y-1.5">
          {lines.map((line) => (
            <div
              key={line._id}
              className="flex items-center justify-between gap-2 text-xs text-muted-foreground font-mono"
            >
              <span>
                {line.session_date
                  ? new Date(line.session_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : line.description || "Session"}
              </span>
              <span>€{Number(line.line_total || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormulaBox({ value, label, highlight }) {
  return (
    <div
      className={`rounded-lg px-3 py-2 min-w-[4.5rem] ${
        highlight
          ? "border-2 border-amber-500/70 bg-amber-50/50"
          : "border border-border bg-muted/40"
      }`}
    >
      <p className="text-sm font-bold text-foreground font-mono leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
