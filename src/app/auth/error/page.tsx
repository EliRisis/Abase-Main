import { AlertTriangle } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle size={36} className="text-danger" />
      <h1 className="text-title">Sign-in link didn&apos;t work</h1>
      <p className="max-w-sm text-body text-muted">
        That link may have expired or already been used. Try signing in
        again.
      </p>
      <Button asChild>
        <Link href="/login">Back to log in</Link>
      </Button>
    </div>
  );
}
