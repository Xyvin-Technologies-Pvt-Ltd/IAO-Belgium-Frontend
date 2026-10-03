import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Road travel display: addresses + one-way × return × rate formula (matches product mock).
 */
export default function ProformaTravelRoadCard({
  item,
  editable = false,
  oneWayKm,
  ratePerKm,
  onOneWayChange,
  onRateChange,
  adjusting = false,
  onToggleAdjust,
  dirty = false,
  superseded = false,
}) {
  const origin = item?.origin_address || "—";
  const destination = item?.destination_address || "—";
  const tripMult = Number(item?.road_multiplier || 2);
  const oneWayDisplay =
    oneWayKm != null && oneWayKm !== ""
      ? Number(oneWayKm)
      : Number(item?.road_one_way_km ?? 0);
  const rate =
    ratePerKm != null && ratePerKm !== ""
      ? Number(ratePerKm)
      : Number(item?.road_unit_rate ?? item?.unit_rate ?? 0);
  const billable = Math.round(oneWayDisplay * tripMult * 1000) / 1000;
  const formulaTotal = Math.round(billable * rate * 100) / 100;
  const snapTotal = Number(item?.road_calculated_total) || 0;
  const total =
    superseded && snapTotal > 0
      ? snapTotal
      : Number(item?.line_total) > 0
        ? Number(item.line_total)
        : formulaTotal;
  const oneWayInputValue =
    adjusting && oneWayKm != null && oneWayKm !== ""
      ? String(oneWayKm)
      : oneWayDisplay > 0
        ? String(oneWayDisplay)
        : "";
  const rateInputValue =
    ratePerKm != null && ratePerKm !== ""
      ? String(ratePerKm)
      : rate > 0
        ? String(rate)
        : "";

  return (
    <div className={`space-y-4 ${superseded ? "opacity-70" : ""}`}>
      {superseded && (
        <p className="text-xs rounded-md border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2">
          Not included in total — another travel option (Rail or Flight) is active. Only one travel
          option can be claimed.
        </p>
      )}
      <div className="space-y-2 text-sm">
        <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
          <span className="text-muted-foreground sm:w-36 shrink-0">Home address</span>
          <span className="text-foreground font-medium">{origin}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
          <span className="text-muted-foreground sm:w-36 shrink-0">Hotel address</span>
          <span className="text-foreground font-medium">{destination}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-6 gap-1 items-start sm:items-center">
          <span className="text-muted-foreground sm:w-36 shrink-0">One-way distance</span>
          {adjusting && editable ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={oneWayInputValue}
                onChange={(e) => onOneWayChange?.(e.target.value)}
                className="h-8 w-28 font-mono text-sm"
              />
              <span className="text-xs text-muted-foreground">km</span>
            </div>
          ) : (
            <span className="text-foreground font-medium font-mono">
              {oneWayDisplay > 0 ? `${oneWayDisplay} km` : "—"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <FormulaBox
          value={oneWayDisplay > 0 ? String(oneWayDisplay) : "—"}
          unit="km"
          label="one way"
          editing={adjusting && editable}
        />
        <span className="text-muted-foreground font-semibold text-sm">×</span>
        <FormulaBox value={String(tripMult)} label="return trip" />
        <span className="text-muted-foreground font-semibold text-sm">×</span>
        {adjusting && editable ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 min-w-[5.5rem]">
            <Input
              type="number"
              step="0.0001"
              min="0"
              value={rateInputValue}
              onChange={(e) => onRateChange?.(e.target.value)}
              className="h-7 font-mono text-sm font-bold px-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">per km</p>
          </div>
        ) : (
          <FormulaBox
            value={rate > 0 ? `€${rate.toFixed(4)}` : "—"}
            label="per km"
          />
        )}
        <span className="text-muted-foreground font-semibold text-sm">=</span>
        <FormulaBox
          value={`€${total.toFixed(2)}`}
          label={superseded ? "not billed" : "travel allowance"}
          highlight
          dirty={dirty}
        />

        {editable && !superseded && (
          <div className="ml-auto flex items-center gap-2">
            {adjusting ? (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onToggleAdjust?.(false)}>
                Cancel
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => onToggleAdjust?.(true)}
              >
                Adjust distance
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FormulaBox({ value, unit, label, highlight, dirty, editing }) {
  return (
    <div
      className={`rounded-lg px-3 py-2 min-w-[4.5rem] ${
        highlight
          ? `border-2 ${dirty ? "border-amber-400 bg-amber-50" : "border-amber-500/70 bg-amber-50/50"}`
          : "border border-border bg-muted/40"
      } ${editing ? "ring-1 ring-primary/30" : ""}`}
    >
      <p className="text-sm font-bold text-foreground font-mono leading-tight">
        {value}
        {unit ? ` ${unit}` : ""}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
