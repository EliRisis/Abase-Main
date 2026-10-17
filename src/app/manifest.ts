import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Abase — Athlete Training",
    short_name: "Abase",
    description:
      "Position-specific workouts and multi-week training plans for athletes.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0b09",
    theme_color: "#c8ff2e",
    orientation: "portrait",
    categories: ["health", "fitness", "sports"],
    icons: [
      {
        src: "/icons/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
