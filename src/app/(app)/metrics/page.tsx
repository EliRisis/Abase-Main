import { ArrowDown, ArrowUp, Minus, TrendingUp } from "@/components/icons";
import { LogMetricDialog } from "@/components/metrics/log-metric-dialog";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";
import { detectPlateaus } from "@/lib/program/plateau";
import { CATEGORY_LABEL } from "@/lib/training";
import type { Tables } from "@/lib/database.types";

export const metadata = { title: "Metrics" };

export default async function MetricsPage() {
  const { supabase, user, profile } = await requireOnboardedProfile();

  const { data: position } = profile.position_id
    ? await supabase
        .from("positions")
        .select("archetype_id")
        .eq("id", profile.position_id)
        .maybeSingle()
    : { data: null };

  const [{ data: allMetrics }, { data: myLogs }, { data: archetypeLinks }] = await Promise.all([
    supabase.from("metric_definitions").select("*").order("sort_order"),
    supabase
      .from("metric_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_on", { ascending: false }),
    supabase.from("metric_archetypes").select("metric_id, archetype_id"),
  ]);

  const restrictedMetricIds = new Set((archetypeLinks ?? []).map((l) => l.metric_id));
  const myArchetypeMetricIds = new Set(
    (archetypeLinks ?? [])
      .filter((l) => l.archetype_id === position?.archetype_id)
      .map((l) => l.metric_id),
  );

  const applicable = (allMetrics ?? []).filter((m) => {
    if (m.sport_id && m.sport_id !== profile.sport_id) return false;
    if (restrictedMetricIds.has(m.id) && !myArchetypeMetricIds.has(m.id)) return false;
    return true;
  });

  const plateaus = detectPlateaus(
    applicable.map((m) => ({
      slug: m.slug,
      name: m.name,
      unit: m.unit,
      direction: m.direction,
      attribute: m.attribute,
      logs: (myLogs ?? []).filter((l) => l.metric_id === m.id).map((l) => ({ value: Number(l.value), date: l.logged_on })),
    })),
  );

  const logsByMetric = new Map<string, Tables<"metric_logs">[]>();
  for (const log of myLogs ?? []) {
    const list = logsByMetric.get(log.metric_id) ?? [];
    list.push(log);
    logsByMetric.set(log.metric_id, list);
  }

  return (
    <div className="flex flex-col gap-page">
      <div>
        <h1 className="text-title">Metrics</h1>
        <p className="mt-1 text-body text-muted">
          Test yourself whenever — track it here, separate from daily workout logs.
        </p>
      </div>

      {plateaus.length > 0 && (
        <div className="flex flex-col gap-2">
          {plateaus.map((p) => (
            <p key={p.slug} className="flex items-start gap-2 rounded-control border border-warning/40 bg-warning/10 px-3 py-2 text-caption">
              <TrendingUp size={14} className="mt-0.5 shrink-0 text-warning" />
              <span>{p.message}</span>
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-section">
        {applicable.length === 0 && (
          <p className="rounded-card border border-dashed border-border p-6 text-center text-body text-muted">
            No metrics are set up for your sport yet.
          </p>
        )}
        {applicable.map((metric) => {
          const logs = (logsByMetric.get(metric.id) ?? []).sort(
            (a, b) => b.logged_on.localeCompare(a.logged_on),
          );
          const latest = logs[0];
          const prior = logs[1];
          const better =
            latest && prior
              ? metric.direction === "higher_is_better"
                ? latest.value > prior.value
                : latest.value < prior.value
              : null;
          const worse =
            latest && prior
              ? metric.direction === "higher_is_better"
                ? latest.value < prior.value
                : latest.value > prior.value
              : null;

          return (
            <div key={metric.id} className="surface-card p-card-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-subheading">{metric.name}</p>
                  <p className="text-caption text-muted">{CATEGORY_LABEL[metric.category]}</p>
                </div>
                <LogMetricDialog metric={metric} />
              </div>

              {latest ? (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-stat">
                    {latest.value} <span className="text-label text-muted">{metric.unit}</span>
                  </span>
                  {better !== null && (
                    <span
                      className={
                        "inline-flex items-center gap-0.5 text-caption font-semibold " +
                        (better ? "text-success" : worse ? "text-danger" : "text-muted")
                      }
                    >
                      {better ? <ArrowUp size={13} /> : worse ? <ArrowDown size={13} /> : <Minus size={13} />}
                      {prior!.value} {metric.unit} prior
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-body text-muted">No test logged yet</p>
              )}

              {logs.length > 1 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-caption font-medium text-primary">
                    <TrendingUp size={12} className="mr-1 inline" />
                    History ({logs.length})
                  </summary>
                  <div className="mt-2 flex flex-col divide-y divide-border">
                    {logs.map((l) => (
                      <div key={l.id} className="flex items-center justify-between py-1.5 text-caption">
                        <span className="text-muted">{l.logged_on}</span>
                        <span className="font-medium">
                          {l.value} {metric.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
