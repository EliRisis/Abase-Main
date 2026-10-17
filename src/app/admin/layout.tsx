import Link from "next/link";
import { AdminNav } from "@/components/layout/admin-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireAdminProfile } from "@/lib/auth/require-profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminProfile();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background safe-top">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-title tracking-wide">
              Abase
            </Link>
            <span className="rounded-chip bg-primary px-2 py-1 text-label text-primary-foreground">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="px-3 py-2 text-label text-muted hover:text-foreground"
            >
              Exit admin
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-6 sm:flex-row">
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
