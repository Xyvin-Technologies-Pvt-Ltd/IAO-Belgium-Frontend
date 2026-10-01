import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Fixed per-module travel — one flat rate for the planning/module.
 */
export default function ProformaTravelFixedCard({ items = [], editable = false, busy = false, onSaveRate }) {
  const lines = Array.isArray(items) ? items : [];
  if (lines.length === 0) return null;

  const line = lines[0];
  const rate = Number(line?.unit_rate || line?.line_total || 0);
  const total = Math.round(Number(line?.line_total || rate) * 100) / 100;

  const [editing, setEditing] = useState(false);
  const [rateDraft, setRateDraft] = useState(String(rate));

  const startEdit = () => {
    setRateDraft(String(rate));
    setEditing(true);
  };

  const save = async () => {
    const next = Number(rateDraft);
    if (Number.isNaN(next) || next < 0) return;
    await onSaveRate?.(next);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-sm">
        <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
          <span className="text-muted-foreground sm:w-36 shrink-0">Pricing mode</span>
          <span className="text-foreground font-medium">Fixed rate per module</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <FormulaBox value="1" label="module" />
        <span className="text-muted-foreground font-semibold text-sm">×</span>
        {editing && editable ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 min-w-[5.5rem]">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={rateDraft}
              onChange={(e) => setRateDraft(e.target.value)}
              className="h-7 font-mono text-sm font-bold px-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
              disabled={busy}
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">per module</p>
          </div>
        ) : (
          <FormulaBox value={rate > 0 ? `€${rate.toFixed(2)}` : "—"} label="per module" />
        )}
        <span className="text-muted-foreground font-semibold text-sm">=</span>
        <FormulaBox
          value={
            editing
              ? `€${(Math.round(Number(rateDraft || 0) * 100) / 100).toFixed(2)}`
              : `€${total.toFixed(2)}`
          }
          label="travel allowance"
          highlight
        />
        {editable && (
          <div className="ml-auto flex items-center gap-2">
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={busy}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" className="h-8 text-xs" disabled={busy} onClick={save}>
                  Save rate
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={startEdit}>
                Adjust rate
              </Button>
            )}
          </div>
        )}
      </div>
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
