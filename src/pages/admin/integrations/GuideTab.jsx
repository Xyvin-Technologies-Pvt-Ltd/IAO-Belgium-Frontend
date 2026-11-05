import { AlertTriangle, ArrowRight, CalendarCheck, Compass, ListChecks, Route } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COUNT_ORDER, LINE_STYLES } from "./payoutUi";

//* Plain-language guide for admins / finance: how IAO → Exact → xCore works,
//* what each tab is for, what to watch out for, and what is still planned.
//* All text lives in en.json (integrations.exact.guide) so it can be translated.

function useList(key) {
  const { t } = useTranslation();
  const value = t(key, { returnObjects: true });
  return Array.isArray(value) ? value : [];
}

const ICON_CLASS = "h-4 w-4 text-blue-600";

function Section({ icon, title, children }) {
  return (
    <section className="rounded-lg border dark:border-white/10 px-5 py-4 space-y-3">
      <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
        {icon}
        {title}
      </h4>
      {children}
    </section>
  );
}

function Bullets({ items, tone = "default" }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.title || item} className="flex gap-2">
          {tone === "warn" ? (
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          ) : (
            <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          )}
          <span>
            {item.title ? <span className="font-medium text-gray-900 dark:text-white">{item.title}: </span> : null}
            <span className="text-muted-foreground">{item.text || item}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const GuideTab = () => {
  const { t } = useTranslation();
  const g = (key, opts) => t(`integrations.exact.guide.${key}`, opts);
  const flow = useList("integrations.exact.guide.flow.steps");
  const tabs = useList("integrations.exact.guide.tabs.items");
  const routine = useList("integrations.exact.guide.routine.steps");
  const careful = useList("integrations.exact.guide.careful.items");
  const next = useList("integrations.exact.guide.next.items");

  return (
    <div className="space-y-4 max-w-4xl">
      <p className="text-sm text-muted-foreground">{g("intro")}</p>

      <Section icon={<Route className={ICON_CLASS} />} title={g("flow.title")}>
        <ol className="space-y-2 text-sm">
          {flow.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-muted-foreground pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={<Compass className={ICON_CLASS} />} title={g("tabs.title")}>
        <Bullets items={tabs} />
      </Section>

      <Section icon={<ListChecks className={ICON_CLASS} />} title={g("statuses.title")}>
        <p className="text-sm text-muted-foreground">{g("statuses.intro")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {COUNT_ORDER.map((status) => (
            <div key={status} className="flex items-start gap-2 text-sm">
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${LINE_STYLES[status]}`}
              >
                {t(`integrations.exact.payouts.line.${status}`)}
              </span>
              <span className="text-muted-foreground">{t(`integrations.exact.payouts.lineHint.${status}`)}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<CalendarCheck className={ICON_CLASS} />} title={g("routine.title")}>
        <ol className="list-decimal ml-5 space-y-1 text-sm text-muted-foreground">
          {routine.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section icon={<AlertTriangle className={ICON_CLASS} />} title={g("careful.title")}>
        <Bullets items={careful} tone="warn" />
      </Section>

      <Section icon={<ArrowRight className={ICON_CLASS} />} title={g("next.title")}>
        <Bullets items={next} />
      </Section>
    </div>
  );
};

export default GuideTab;
