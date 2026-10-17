import { ImageResponse } from "next/og";
import { BrandMark } from "@/lib/brand-icon";

export async function GET() {
  return new ImageResponse(<BrandMark size={192} inset={0.16} radius={42} />, {
    width: 192,
    height: 192,
  });
}
