import { ImageResponse } from "next/og";
import { BrandMark } from "@/lib/brand-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandMark size={32} inset={0.1} radius={7} />, size);
}
