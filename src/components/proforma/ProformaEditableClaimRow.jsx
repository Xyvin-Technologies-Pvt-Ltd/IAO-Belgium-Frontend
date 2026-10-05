import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Paperclip, Pencil, Trash2 } from "lucide-react";
import { openSecureFile } from "@/utils/secureFile";
import { toast } from "sonner";

const eur = (n) => `€${Number(n || 0).toFixed(2)}`;

/**
 * Claim / ticket line with optional in-place amount (+ description) edit.
 */
export default function ProformaEditableClaimRow({
  line,
  editable = false,
  busy = false,
  modeBadge,
  onSave,
  onRemove,
}) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(line.description || "");
  const [amount, setAmount] = useState(String(line.line_total ?? line.unit_rate ?? ""));

  const startEdit = () => {
    setDescription(line.description || "");
    setAmount(String(line.line_total ?? line.unit_rate ?? ""));
    setEditing(true);
  };

  const save = async () => {
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) return;
    await onSave?.({
      description: description.trim() || line.description,
      amount: amt,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 space-y-3 bg-background">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              className="mt-1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <Label className="text-xs">Amount (€)</Label>
            <Input
              className="mt-1 font-mono"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={busy} onClick={save}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {modeBadge && (
            <span className="uppercase text-[10px] font-bold text-muted-foreground mr-2">
              {modeBadge}
            </span>
          )}
          {line.description}
        </p>
        <p className="text-xs font-mono text-muted-foreground">{eur(line.line_total)}</p>
        {(line.attachments || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {line.attachments.map((a, idx) => (
              <button
                type="button"
                key={a._id || a.file_url || idx}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                onClick={async () => {
                  try {
                    await openSecureFile(a.file_url || a.key, a.file_name);
                  } catch (err) {
                    toast.error(err?.message || "Could not open file");
                  }
                }}
              >
                <Paperclip className="w-3 h-3" />
                {a.file_name}
              </button>
            ))}
          </div>
        )}
      </div>
      {editable && (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8" disabled={busy} onClick={startEdit}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          {onRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive h-8"
              disabled={busy}
              onClick={() => onRemove(line._id)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
