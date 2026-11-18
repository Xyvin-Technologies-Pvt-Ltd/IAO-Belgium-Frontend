import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

//* status per step: done = live now, partial = some tools live, planned = coming.
const STEPS = [
  { key: "audit", status: "done" },
  { key: "decide", status: "planned" },
  { key: "fix", status: "partial" },
  { key: "confirm", status: "planned" },
];

function StatusIcon({ status }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "partial") return <Clock className="h-4 w-4 text-amber-600" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

/** The 4-step clean-up plan, shown on the Audit tab so everyone sees where we are. */
const AuditPlan = () => {
  const { t } = useTranslation();
  const p = (key, opts) => t(`integrations.exact.audit.plan.${key}`, opts);
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border dark:border-white/10 px-4 py-3 text-sm space-y-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span>
          <span className="font-semibold text-gray-900 dark:text-white">{p("title")}</span>
          <span className="block text-muted-foreground">{p("intro")}</span>
        </span>
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
      </button>

      {open ? (
        <ol className="space-y-3">
          {STEPS.map((step, i) => {
            const items = t(`integrations.exact.audit.plan.steps.${step.key}.items`, { returnObjects: true });
            return (
              <li key={step.key} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-medium text-gray-900 dark:text-white">
                    {p(`steps.${step.key}.title`)}
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <StatusIcon status={step.status} />
                      {p(`status.${step.status}`)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{p(`steps.${step.key}.text`)}</p>
                  {Array.isArray(items) && items.length ? (
                    <ul className="list-disc ml-5 text-muted-foreground space-y-0.5">
                      {items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
};

export default AuditPlan;
