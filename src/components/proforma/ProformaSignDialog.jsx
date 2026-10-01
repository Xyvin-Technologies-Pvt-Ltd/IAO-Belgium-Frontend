import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PenTool } from "lucide-react";
import { proformaTeacherName } from "@/utils/proformaCourseLabel";

function normalizeBank(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

function validateSignForm({ signed_by_name, bank_account_number }) {
  const errors = {};
  const name = String(signed_by_name || "").trim();
  const bank = normalizeBank(bank_account_number);

  if (!name) errors.signed_by_name = "Full legal name is required";
  else if (name.length < 2) errors.signed_by_name = "Enter at least 2 characters";

  if (!bank) errors.bank_account_number = "Bank account number is required";
  else if (bank.length < 8) errors.bank_account_number = "Must be at least 8 characters";
  else if (bank.length > 34) errors.bank_account_number = "Must be at most 34 characters";
  else if (!/^[A-Z0-9]+$/.test(bank)) {
    errors.bank_account_number = "Letters and numbers only (no spaces or symbols)";
  }

  return { errors, name, bank, valid: Object.keys(errors).length === 0 };
}

/**
 * Sign & approve dialog: legal name + bank account number.
 */
export default function ProformaSignDialog({
  open,
  onOpenChange,
  proforma,
  busy = false,
  onConfirm,
}) {
  const [signedByName, setSignedByName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !proforma) return;
    const teacher = proforma.teacher_id || {};
    setSignedByName(proformaTeacherName(teacher, ""));
    setBankAccount(normalizeBank(teacher.IBAN || ""));
    setErrors({});
  }, [open, proforma]);

  const submit = async () => {
    const { errors: nextErrors, name, bank, valid } = validateSignForm({
      signed_by_name: signedByName,
      bank_account_number: bankAccount,
    });
    setErrors(nextErrors);
    if (!valid) return;
    await onConfirm?.({ signed_by_name: name, bank_account_number: bank });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign &amp; approve</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <Label htmlFor="sign-name" className="text-xs font-semibold">
              Full legal name
            </Label>
            <Input
              id="sign-name"
              className="mt-1.5"
              value={signedByName}
              onChange={(e) => {
                setSignedByName(e.target.value);
                if (errors.signed_by_name) setErrors((p) => ({ ...p, signed_by_name: undefined }));
              }}
              placeholder="As it appears on your ID"
              disabled={busy}
              autoFocus
            />
            {errors.signed_by_name && (
              <p className="text-xs text-destructive mt-1">{errors.signed_by_name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="sign-bank" className="text-xs font-semibold">
              Bank account number (IBAN)
            </Label>
            <Input
              id="sign-bank"
              className="mt-1.5 font-mono"
              value={bankAccount}
              onChange={(e) => {
                setBankAccount(normalizeBank(e.target.value));
                if (errors.bank_account_number) {
                  setErrors((p) => ({ ...p, bank_account_number: undefined }));
                }
              }}
              placeholder="e.g. BE68539007547034"
              disabled={busy}
            />
            {errors.bank_account_number && (
              <p className="text-xs text-destructive mt-1">{errors.bank_account_number}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={busy}
            onClick={submit}
          >
            {busy ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PenTool className="w-4 h-4 mr-2" />
            )}
            Sign &amp; approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
