import { Compass } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <Compass size={36} className="text-primary" />
      <h1 className="text-title">Page not found</h1>
      <p className="max-w-sm text-body text-muted">
        That page doesn&apos;t exist, or may have moved.
      </p>
      <Button asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
