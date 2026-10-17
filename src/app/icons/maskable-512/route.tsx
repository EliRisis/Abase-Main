import { ImageResponse } from "next/og";
import { BrandMark } from "@/lib/brand-icon";

// Maskable icons must fill the full square edge-to-edge with the background
// color; the OS applies its own mask shape on top, so the logo needs extra
// inset padding to stay inside the safe zone.
export async function GET() {
  return new ImageResponse(<BrandMark size={512} inset={0.3} radius={0} />, {
    width: 512,
    height: 512,
  });
}
