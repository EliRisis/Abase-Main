import Image from "next/image";
import { humanize, iconFor, type IconKind } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Sport / position artwork. The art is off-white and lime, drawn for dark surfaces, so it always sits on
 * a dark badge (the same in light and dark themes). Never recolored.
 */
export function AppIcon({
  kind,
  slug,
  sportSlug,
  name,
  size = 24,
  className,
  bare,
  decorative,
}: {
  kind: IconKind;
  slug: string | null | undefined;
  /** Fallback for a position that has no artwork of its own. */
  sportSlug?: string | null;
  /** Accessible name; defaults to the humanized slug. */
  name?: string;
  size?: number;
  className?: string;
  /** Skip the dark badge (only when the surface is already dark). */
  bare?: boolean;
  /** Sits next to its own name in text, so screen readers should skip the image. */
  decorative?: boolean;
}) {
  const src = iconFor(kind, slug, sportSlug);
  if (!src) return null;
  const alt = decorative ? "" : (name ?? (slug ? humanize(slug) : ""));
  const pad = Math.max(2, Math.round(size * 0.12));
  const img = <Image src={src} alt={alt} width={size} height={size} className="block select-none" draggable={false} />;
  if (bare) return <span className={cn("inline-flex shrink-0", className)}>{img}</span>;
  return (
    <span className={cn("icon-badge inline-flex shrink-0 items-center justify-center", className)} style={{ padding: pad }}>
      {img}
    </span>
  );
}

export const SportIcon = (p: Omit<Parameters<typeof AppIcon>[0], "kind">) => <AppIcon kind="sport" {...p} />;
export const PositionIcon = (p: Omit<Parameters<typeof AppIcon>[0], "kind">) => <AppIcon kind="position" {...p} />;

/** Icon + name on one line, for select items and list rows. */
export function SportLabel({ slug, name, size = 20 }: { slug: string | null | undefined; name: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <SportIcon slug={slug} name={name} size={size} decorative />
      <span>{name}</span>
    </span>
  );
}

export function PositionLabel({ slug, sportSlug, name, size = 20 }: { slug: string | null | undefined; sportSlug?: string | null; name: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <PositionIcon slug={slug} sportSlug={sportSlug} name={name} size={size} decorative />
      <span>{name}</span>
    </span>
  );
}
