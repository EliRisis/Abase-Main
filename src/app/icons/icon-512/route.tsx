import { ImageResponse } from "next/og";
import { BrandMark } from "@/lib/brand-icon";

export async function GET() {
  return new ImageResponse(<BrandMark size={512} inset={0.16} radius={112} />, {
    width: 512,
    height: 512,
  });
}
