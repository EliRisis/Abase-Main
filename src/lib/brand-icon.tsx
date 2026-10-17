import type { CSSProperties } from "react";

/**
 * Shared JSX for the Abase brand mark, rendered via next/og ImageResponse in
 * the various icon route handlers. `inset` controls the safe-zone padding
 * (larger inset = more background showing, needed for maskable icons).
 */
export function BrandMark({
  size,
  inset = 0.16,
  radius,
}: {
  size: number;
  inset?: number;
  radius?: number;
}) {
  const pad = Math.round(size * inset);
  const containerStyle: CSSProperties = {
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#C8FF2E",
    borderRadius: radius ?? size * 0.12,
  };

  return (
    <div style={containerStyle}>
      <svg
        width={size - pad * 2}
        height={size - pad * 2}
        viewBox="0 0 100 100"
      >
        <path
          d="M50 10 L88 74 H12 Z"
          fill="#0A0B09"
        />
        <rect x="22" y="82" width="56" height="8" fill="#0A0B09" />
      </svg>
    </div>
  );
}
