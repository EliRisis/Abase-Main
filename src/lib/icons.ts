// Sport and position artwork. Files live in public/icons/{sports,positions}/<slug>.png and the slug is the
// slug of the matching `sports` / `positions` row. This is the only place that knows those paths.

export const SPORT_ICONS: Record<string, string> = {
  football: "/icons/sports/football.png",
  basketball: "/icons/sports/basketball.png",
  baseball: "/icons/sports/baseball.png",
  soccer: "/icons/sports/soccer.png",
};

export const POSITION_ICONS: Record<string, { src: string; sport: string }> = {
  quarterback: { src: "/icons/positions/quarterback.png", sport: "football" },
  "wide-receiver": { src: "/icons/positions/wide-receiver.png", sport: "football" },
  "offensive-lineman": { src: "/icons/positions/offensive-lineman.png", sport: "football" },
  linebacker: { src: "/icons/positions/linebacker.png", sport: "football" },
  "point-guard": { src: "/icons/positions/point-guard.png", sport: "basketball" },
  "shooting-guard": { src: "/icons/positions/shooting-guard.png", sport: "basketball" },
  center: { src: "/icons/positions/center.png", sport: "basketball" },
  pitcher: { src: "/icons/positions/pitcher.png", sport: "baseball" },
  infielder: { src: "/icons/positions/infielder.png", sport: "baseball" },
  outfielder: { src: "/icons/positions/outfielder.png", sport: "baseball" },
  goalkeeper: { src: "/icons/positions/goalkeeper.png", sport: "soccer" },
  defender: { src: "/icons/positions/defender.png", sport: "soccer" },
  midfielder: { src: "/icons/positions/midfielder.png", sport: "soccer" },
  forward: { src: "/icons/positions/forward.png", sport: "soccer" },
};

export type IconKind = "sport" | "position";

/**
 * Resolve an icon by slug. A position with no artwork falls back to its sport's icon (when the sport slug is
 * known); anything else resolves to null, and callers render nothing. Never an emoji.
 */
export function iconFor(kind: IconKind, slug: string | null | undefined, sportSlug?: string | null): string | null {
  if (kind === "sport") return (slug && SPORT_ICONS[slug]) || null;
  const own = slug ? POSITION_ICONS[slug]?.src : undefined;
  if (own) return own;
  const sport = sportSlug ?? (slug ? POSITION_ICONS[slug]?.sport : undefined);
  return (sport && SPORT_ICONS[sport]) || null;
}

export function humanize(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
