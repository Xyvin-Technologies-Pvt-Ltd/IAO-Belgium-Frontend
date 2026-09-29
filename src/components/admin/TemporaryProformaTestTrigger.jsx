import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { triggerPlanningProformaTest } from "@/api/proformaApi";

/**
 * TEMPORARY TEST TRIGGER SCREEN
 * Allows admins/developers to enter a planning_id and trigger proforma invoice calculation on demand.
 * This is a standalone file that can be easily removed later.
 */
export default function TemporaryProformaTestTrigger({ onTriggerSuccess }) {
  const [planningId, setPlanningId] = useState("6ab4a4a18f9bacf250937c2c");
  const [loading, setLoading] = useState(false);
  const [logOutput, setLogOutput] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleTrigger = async (e) => {
    e.preventDefault();
    if (!planningId.trim()) return;

    setLoading(true);
    setLogOutput(null);
    setErrorMsg(null);

    try {
      const response = await triggerPlanningProformaTest(planningId.trim());
      setLogOutput(response?.data || response);
      if (onTriggerSuccess) {
        onTriggerSuccess();
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Failed to trigger planning invoice calculation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 my-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-amber-900 dark:text-amber-300">
              ⚡ Temporary Test Tool: Trigger Proforma Invoice Calculation
            </CardTitle>
            <CardDescription className="text-xs text-amber-800/80 dark:text-amber-400 mt-1">
              Enter any Planning ID below to manually trigger tariff resolution and invoice generation for assigned teachers.
            </CardDescription>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono bg-amber-200 text-amber-900 rounded font-bold">
            TEMP TEST UI
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleTrigger} className="flex items-center gap-3">
          <Input
            type="text"
            value={planningId}
            onChange={(e) => setPlanningId(e.target.value)}
            placeholder="Paste Planning ID (e.g. 6ab4a4a18f9bacf250937c2c)"
            className="flex-1 font-mono text-sm bg-white dark:bg-black"
          />
          <Button
            type="submit"
            disabled={loading || !planningId.trim()}
            className="bg-amber-700 hover:bg-amber-800 text-white font-semibold whitespace-nowrap"
          >
            {loading ? "Triggering..." : "Trigger Invoice Generation"}
          </Button>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg text-xs font-mono leading-relaxed">
            <strong>❌ Trigger Error:</strong> {errorMsg}
          </div>
        )}

        {logOutput && (
          <div className="p-3 bg-card border border-border rounded-lg space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between font-bold text-foreground border-b border-border pb-1">
              <span>Status: Success</span>
              <span>City Resolved: {logOutput.city || "N/A"}</span>
            </div>
            <div className="space-y-1">
              {logOutput.results?.map((res, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>
                    {res.type === "INVOICE" ? "🎉 Invoice Generated:" : "⚠️ Configuration Exception:"} {res.proforma_number || res.error_message}
                  </span>
                  {res.grand_total !== undefined && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">€{res.grand_total}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
