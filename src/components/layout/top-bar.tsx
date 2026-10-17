"use client";

import { CalendarRange, Dumbbell, Home, LineChart, LogOut, Shield, User } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/program", label: "Program", icon: CalendarRange },
  { href: "/plans", label: "Modules", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
];

export function TopBar({
  displayName,
  isAdmin,
}: {
  displayName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background safe-top">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/today" className="flex items-center gap-2 text-title leading-none tracking-wide" aria-label="Abase home">
            <span className="flex h-7 w-7 items-center justify-center rounded-chip bg-primary text-primary-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l9 15H3z" /><rect x="6" y="20" width="12" height="2.5" /></svg>
            </span>
            <span>Abase</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border-b-[3px] px-3 py-2 text-button transition",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-raised text-button text-foreground ring-1 ring-border hover:ring-primary"
                aria-label="Account menu"
              >
                {initial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User size={16} /> Profile
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield size={16} /> Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOutAction} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2">
                    <LogOut size={16} /> Log out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
